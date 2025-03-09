import { createNoise2D } from 'simplex-noise';
import {
	HexCoord,
	HexTile,
	TerrainType,
	HexGridConfig,
	TerrainColors,
} from '../types';
import { getHexId, hexToPixel, getHexesInRadius } from './hexUtils';

// Helper function to get domain warping offset
function getDomainWarp(
	x: number,
	y: number,
	noise2D: (x: number, y: number) => number,
	scale: number,
	amplitude: number
): [number, number] {
	// Ensure inputs are valid numbers
	if (!Number.isFinite(x) || !Number.isFinite(y)) {
		console.warn('Invalid coordinates in getDomainWarp:', { x, y });
		return [0, 0];
	}

	const wx = noise2D(x * scale, y * scale) * amplitude;
	const wy = noise2D(x * scale + 31.416, y * scale + 31.416) * amplitude;

	// Check for NaN values
	if (!Number.isFinite(wx) || !Number.isFinite(wy)) {
		console.warn('Invalid warp values:', { wx, wy, x, y, scale, amplitude });
		return [0, 0];
	}

	return [wx, wy];
}

// Generate terrain for a hex grid
export function generateTerrain(
	hexes: HexCoord[],
	config: HexGridConfig,
	seed: number
): HexTile[] {
	// Validate inputs
	if (!Number.isFinite(seed)) {
		console.error('Invalid seed value:', seed);
		seed = Math.random();
	}

	// Initialize noise functions with seed
	const elevationNoise = createNoise2D(() => seed);
	const elevationNoise2 = createNoise2D(() => seed + 0.5);
	const warpNoise = createNoise2D(() => seed + 0.75);
	const varietyNoise = createNoise2D(() => seed + 0.25);
	const oceanNoise = createNoise2D(() => seed + 0.125);
	const mountainNoise = createNoise2D(() => seed + 0.875); // New noise for mountain variation

	// Define constants
	const BASE_HEIGHT = 1.5;
	const regionScale = 0.3; // Controls how quickly regional variations occur

	// Pre-calculate heights for all hexes in a map to avoid recalculation
	const heightMap = new Map<string, number>();

	// Determine the world variety based on seed (with safety checks)
	const worldVariety = Math.max(0, Math.min(1, (varietyNoise(0, 0) + 1) / 2));
	const islandFactor = Math.max(0, Math.min(1, worldVariety * 2));

	// Helper to calculate height for a hex
	const calculateHeight = (q: number, r: number, s: number): number => {
		// Validate inputs
		if (!Number.isFinite(q) || !Number.isFinite(r) || !Number.isFinite(s)) {
			console.error('Invalid hex coordinates:', { q, r, s });
			return BASE_HEIGHT;
		}

		const key = `${q},${r},${s}`;
		if (heightMap.has(key)) {
			return heightMap.get(key)!;
		}

		// Skip if outside grid
		if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > config.radius) {
			return BASE_HEIGHT;
		}

		const [x, y] = hexToPixel({ q, r, s }, config.hexSize);

		// Validate coordinates
		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			console.error('Invalid pixel coordinates:', { x, y, q, r, s });
			return BASE_HEIGHT;
		}

		// Apply domain warping with safety checks
		const [warpX, warpY] = getDomainWarp(
			x / (config.radius * config.hexSize),
			y / (config.radius * config.hexSize),
			warpNoise,
			Math.max(0.1, Math.min(2, config.noiseScale * 0.5)), // Constrain scale
			20
		);

		// Calculate warped coordinates with safety checks
		const wx = Number.isFinite(x + warpX) ? x + warpX : x;
		const wy = Number.isFinite(y + warpY) ? y + warpY : y;

		// Calculate local tendencies using noise
		const nx_region = (wx / (config.radius * config.hexSize)) * regionScale;
		const ny_region = (wy / (config.radius * config.hexSize)) * regionScale;

		// Calculate ocean and mountain tendencies
		const localOceanTendency = Math.max(
			0,
			Math.min(1, (oceanNoise(nx_region, ny_region) + 1) / 2)
		);

		// Offset mountain noise to create different patterns
		const localMountainTendency = Math.max(
			0,
			Math.min(
				1,
				(mountainNoise(nx_region + 31.416, ny_region - 31.416) + 1) / 2
			)
		);

		// First octave - large features
		const nx1 =
			wx /
			(config.radius * config.hexSize * Math.max(0.1, config.noiseScale) * 2);
		const ny1 =
			wy /
			(config.radius * config.hexSize * Math.max(0.1, config.noiseScale) * 2);
		const largeFeatures = Math.max(
			0,
			Math.min(1, (elevationNoise(nx1, ny1) + 1) / 2)
		);

		// Second octave - medium features
		const nx2 =
			wx / (config.radius * config.hexSize * Math.max(0.1, config.noiseScale));
		const ny2 =
			wy / (config.radius * config.hexSize * Math.max(0.1, config.noiseScale));
		const mediumFeatures = Math.max(
			0,
			Math.min(
				1,
				(elevationNoise2(
					nx2 * Math.max(0, config.noiseDetail),
					ny2 * Math.max(0, config.noiseDetail)
				) +
					1) /
					2
			)
		);

		// Calculate base elevation
		let normalizedElevation = Math.max(
			0,
			Math.min(
				1,
				largeFeatures * (1 - Math.max(0, Math.min(1, config.noiseFuzziness))) +
					mediumFeatures * Math.max(0, Math.min(1, config.noiseFuzziness))
			)
		);

		// Apply ocean influence
		const oceanInfluence = Math.pow(localOceanTendency, 1.5);
		normalizedElevation =
			normalizedElevation * (1.6 - oceanInfluence) - 0.3 * oceanInfluence;

		// Apply variety modifications with safety checks
		const centerDistanceFactor = Math.max(
			0,
			Math.min(1, 1 - Math.sqrt(q * q + r * r + s * s) / (config.radius + 1))
		);

		// Mix between pure noise and island shape based on islandFactor
		if (islandFactor > 0) {
			const localIslandFactor =
				islandFactor * Math.max(0.3, localOceanTendency);
			const islandShape =
				normalizedElevation * 0.7 + centerDistanceFactor * 0.3;
			normalizedElevation = Math.max(
				0,
				Math.min(
					1,
					normalizedElevation * (1 - localIslandFactor) +
						islandShape * localIslandFactor
				)
			);
		}

		// Apply regional mountain influence
		if (normalizedElevation > 0.3) {
			const mountainInfluence = Math.pow(localMountainTendency, 2); // Sharper mountain regions
			const mountainEffect =
				Math.pow((normalizedElevation - 0.3) / 0.7, 1.5) * mountainInfluence;

			// Mix between flat and mountainous terrain with increased height potential
			normalizedElevation = Math.max(
				0,
				Math.min(
					1,
					normalizedElevation * (1 - mountainInfluence * 0.7) + // Reduce base height in mountain regions
						(normalizedElevation + mountainEffect * 0.8) * mountainInfluence // Increased mountain peak factor
				)
			);

			// Add extra height to the highest peaks in very mountainous regions
			if (mountainInfluence > 0.8 && normalizedElevation > 0.75) {
				const peakBonus =
					(normalizedElevation - 0.75) * mountainInfluence * 0.5;
				normalizedElevation = Math.min(1, normalizedElevation + peakBonus);
			}
		}

		// Add some random elevation spikes for local variation
		const spikiness = Math.max(0, Math.min(1, varietyNoise(nx1 * 2, ny1 * 2)));
		if (spikiness > 0.8 && normalizedElevation > 0.5) {
			const spikeIntensity = Math.min(0.4, (spikiness - 0.8) * 2); // Increased spike intensity
			normalizedElevation = Math.max(
				0,
				Math.min(
					1,
					normalizedElevation + spikeIntensity * localMountainTendency
				)
			);
		}

		// Ensure elevation stays within bounds
		normalizedElevation = Math.max(0, Math.min(1, normalizedElevation));

		// Calculate final height with safety check
		const height = Math.max(
			BASE_HEIGHT,
			Math.min(
				BASE_HEIGHT + config.gridHeight,
				BASE_HEIGHT + normalizedElevation * config.gridHeight
			)
		);

		if (!Number.isFinite(height)) {
			console.error('Invalid height calculated:', {
				height,
				normalizedElevation,
				q,
				r,
				s,
				x,
				y,
				wx,
				wy,
				largeFeatures,
				mediumFeatures,
			});
			return BASE_HEIGHT;
		}

		heightMap.set(key, height);
		return height;
	};

	// Pre-calculate neighbor offsets for rings
	const ring1Offsets = [
		[1, -1, 0],
		[1, 0, -1],
		[0, 1, -1],
		[-1, 1, 0],
		[-1, 0, 1],
		[0, -1, 1],
	];

	const ring2Offsets = [
		[2, -2, 0],
		[2, -1, -1],
		[2, 0, -2],
		[1, 1, -2],
		[0, 2, -2],
		[-1, 2, -1],
		[-2, 2, 0],
		[-2, 1, 1],
		[-2, 0, 2],
		[-1, -1, 2],
		[0, -2, 2],
		[1, -2, 1],
	];

	// Calculate water level once
	const actualWaterLevel = BASE_HEIGHT + config.waterLevel * config.gridHeight;
	const waterLevelFactor = Math.max(0.2, Math.min(0.8, config.waterLevel));

	// Define bands once
	const SHORE_BAND = 0.1;
	const BEACH_BAND = 0.1 + 0.5 * (1 - waterLevelFactor);
	const SHRUB_BAND = 0.12 + 0.1 * (1 - waterLevelFactor);
	const FOREST_BAND = 0.55 + 0.1 * (1 - waterLevelFactor);
	const STONE_BAND = 0.75; // Lowered stone band
	const SNOW_BAND = 0.92; // Lowered snow threshold

	// Helper to check if a tile should be a cliff
	const isCliff = (
		height: number,
		waterProximity: number,
		neighborHeights: number[]
	): boolean => {
		if (waterProximity === 0) return false;

		// Get the minimum neighbor height (representing potential water level)
		const minNeighborHeight = Math.min(...neighborHeights);

		// Calculate height difference relative to the grid height
		const heightDifference = (height - minNeighborHeight) / config.gridHeight;

		// If the height difference is significant and we're near water, it's a cliff
		const CLIFF_THRESHOLD = 0.25; // Adjust this value to control how steep it needs to be to become a cliff
		return heightDifference > CLIFF_THRESHOLD;
	};

	// Helper to check if a tile is part of a flat plateau
	const isPartOfPlateau = (
		height: number,
		validNeighborHeights: number[],
		gridHeight: number
	): { isPlateau: boolean; isEdge: boolean } => {
		if (validNeighborHeights.length < 3)
			return { isPlateau: false, isEdge: false };

		// Calculate height differences with neighbors
		const heightDifferences = validNeighborHeights.map(
			(nh) => Math.abs(height - nh) / gridHeight
		);

		// Count how many neighbors are at a similar height (small difference)
		const PLATEAU_THRESHOLD = 0.05; // 5% height difference threshold
		const EDGE_THRESHOLD = 0.15; // 15% height difference for edge detection
		const similarHeightCount = heightDifferences.filter(
			(diff) => diff < PLATEAU_THRESHOLD
		).length;

		// Check if any neighbors have a significant height difference (edge detection)
		const hasSignificantDrop = heightDifferences.some(
			(diff) => diff > EDGE_THRESHOLD
		);

		// If most neighbors are at a similar height, it's part of a plateau
		const isPlateau =
			similarHeightCount >= Math.min(4, validNeighborHeights.length * 0.75);

		return {
			isPlateau,
			isEdge: isPlateau && hasSignificantDrop, // Only consider it an edge if it's part of a plateau
		};
	};

	return hexes.map((hex) => {
		// Get or calculate height for current hex
		const height = calculateHeight(hex.q, hex.r, hex.s);
		const finalHeight = height < actualWaterLevel ? actualWaterLevel : height;

		// Early return for water tiles
		if (height < actualWaterLevel) {
			return {
				id: getHexId(hex),
				coord: hex,
				elevation: finalHeight,
				terrainType: TerrainType.WATER,
				waterDepth: Math.max(
					0,
					(height - BASE_HEIGHT) / (actualWaterLevel - BASE_HEIGHT)
				),
			};
		}

		// Calculate normalized height
		const heightAboveWater = height - actualWaterLevel;
		const normalizedHeightAboveWater = heightAboveWater / config.gridHeight;

		// Collect neighbor heights for cliff detection
		const neighborHeights: number[] = [];
		const validNeighborHeights: number[] = []; // New array for valid neighbors only

		// Check first ring
		let waterProximity = 0;
		for (const [dq, dr, ds] of ring1Offsets) {
			const nq = hex.q + dq;
			const nr = hex.r + dr;
			const ns = hex.s + ds;

			// Skip if neighbor is outside the grid
			if (Math.max(Math.abs(nq), Math.abs(nr), Math.abs(ns)) > config.radius) {
				continue;
			}

			const nHeight = calculateHeight(nq, nr, ns);
			neighborHeights.push(nHeight);
			validNeighborHeights.push(nHeight);

			if (nHeight < actualWaterLevel) {
				waterProximity = 1;
			}
		}

		// Only check second ring if needed and first ring had valid neighbors
		if (waterProximity === 0 && validNeighborHeights.length > 0) {
			for (const [dq, dr, ds] of ring2Offsets) {
				const nq = hex.q + dq;
				const nr = hex.r + dr;
				const ns = hex.s + ds;

				// Skip if neighbor is outside the grid
				if (
					Math.max(Math.abs(nq), Math.abs(nr), Math.abs(ns)) > config.radius
				) {
					continue;
				}

				const nHeight = calculateHeight(nq, nr, ns);
				neighborHeights.push(nHeight);
				validNeighborHeights.push(nHeight);

				if (nHeight < actualWaterLevel) {
					waterProximity = 0.5;
				}
			}
		}

		// Check if this should be a cliff (only if we have valid neighbors)
		const cliffCheck =
			validNeighborHeights.length > 0
				? isCliff(height, waterProximity, validNeighborHeights)
				: false;

		// Helper to check if neighbors are high enough for snow (only consider valid neighbors)
		const hasSnowNeighbor =
			validNeighborHeights.length > 0 &&
			validNeighborHeights.some(
				(nh) => (nh - actualWaterLevel) / config.gridHeight > SNOW_BAND
			);

		// Helper to check if all neighbors are high enough for stone (only consider valid neighbors)
		const allNeighborsStone =
			validNeighborHeights.length > 0 &&
			validNeighborHeights.every(
				(nh) => (nh - actualWaterLevel) / config.gridHeight > STONE_BAND
			);

		// Determine terrain type
		let terrainType: TerrainType;
		if (normalizedHeightAboveWater < SHORE_BAND && waterProximity > 0) {
			terrainType = cliffCheck ? TerrainType.STONE : TerrainType.SHORE;
		} else if (normalizedHeightAboveWater < BEACH_BAND && waterProximity > 0) {
			terrainType = cliffCheck ? TerrainType.STONE : TerrainType.BEACH;
		} else if (normalizedHeightAboveWater < SHRUB_BAND) {
			terrainType = TerrainType.SHRUB;
		} else if (normalizedHeightAboveWater < FOREST_BAND) {
			terrainType = TerrainType.FOREST;
		} else if (normalizedHeightAboveWater < STONE_BAND) {
			// Check if this is part of a plateau
			const { isPlateau, isEdge } = isPartOfPlateau(
				height,
				validNeighborHeights,
				config.gridHeight
			);
			terrainType =
				isPlateau && !isEdge ? TerrainType.FOREST : TerrainType.STONE;
		} else if (normalizedHeightAboveWater < SNOW_BAND) {
			// Check mountain influence for snow placement
			const [x, y] = hexToPixel(hex, config.hexSize);
			const nx_region = (x / (config.radius * config.hexSize)) * regionScale;
			const ny_region = (y / (config.radius * config.hexSize)) * regionScale;
			const localMountainCheck = Math.max(
				0,
				Math.min(
					1,
					(mountainNoise(nx_region + 31.416, ny_region - 31.416) + 1) / 2
				)
			);

			// Check for plateaus at high elevations
			const { isPlateau, isEdge } = isPartOfPlateau(
				height,
				validNeighborHeights,
				config.gridHeight
			);

			// For edge tiles, use only height and mountain influence
			if (validNeighborHeights.length === 0) {
				terrainType =
					localMountainCheck > 0.6 ? TerrainType.STONE : TerrainType.FOREST;
			} else {
				// Keep edges as stone, convert only inner plateau areas to forest
				terrainType =
					isPlateau && !isEdge && normalizedHeightAboveWater < 0.85
						? TerrainType.FOREST
						: TerrainType.STONE;
			}
		} else {
			// For highest points, consider snow based on height and mountain influence
			const [x, y] = hexToPixel(hex, config.hexSize);
			const nx_region = (x / (config.radius * config.hexSize)) * regionScale;
			const ny_region = (y / (config.radius * config.hexSize)) * regionScale;
			const localMountainCheck = Math.max(
				0,
				Math.min(
					1,
					(mountainNoise(nx_region + 31.416, ny_region - 31.416) + 1) / 2
				)
			);

			// Check for plateaus at snow level
			const { isPlateau, isEdge } = isPartOfPlateau(
				height,
				validNeighborHeights,
				config.gridHeight
			);

			// For edge tiles or very high points, use simpler logic
			if (
				validNeighborHeights.length === 0 ||
				normalizedHeightAboveWater > 0.95
			) {
				terrainType = TerrainType.SNOW;
			} else {
				// Keep edges as stone/snow, only convert inner plateau areas
				if (isPlateau && !isEdge && normalizedHeightAboveWater < 0.94) {
					terrainType = TerrainType.STONE;
				} else {
					terrainType =
						localMountainCheck > 0.6 &&
						allNeighborsStone &&
						(hasSnowNeighbor || normalizedHeightAboveWater > 0.92)
							? TerrainType.SNOW
							: TerrainType.STONE;
				}
			}
		}

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: finalHeight,
			terrainType,
			waterDepth: 0,
		};
	});
}

// Get the color for a terrain type
export function getTerrainColor(
	terrainType: TerrainType,
	waterDepth: number = 0
): string {
	// For water, adjust the color based on depth
	if (terrainType === TerrainType.WATER) {
		// Get the base water color
		const baseColor = TerrainColors[TerrainType.WATER];

		// Convert hex to RGB
		const r = parseInt(baseColor.slice(1, 3), 16);
		const g = parseInt(baseColor.slice(3, 5), 16);
		const b = parseInt(baseColor.slice(5, 7), 16);

		// Adjust the color based on depth (waterDepth is 0-1, where 0 is deepest)
		// Deeper water is darker and more saturated
		const depthFactor = 0.5 + waterDepth * 0.5; // 0.5 to 1.0

		// Darken the color for deeper water
		const adjustedR = Math.floor(r * depthFactor);
		const adjustedG = Math.floor(g * depthFactor);
		const adjustedB = Math.floor(b); // Keep blue relatively constant

		// Convert back to hex
		return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG
			.toString(16)
			.padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
	}

	// For other terrain types, use the predefined colors
	return TerrainColors[terrainType];
}

export function getTerrainType(
	height: number,
	config: HexGridConfig
): TerrainType {
	const { terrainBands, waterLevel } = config;

	// Water is special - it's anything below water level
	if (height <= waterLevel) {
		return TerrainType.WATER;
	}

	// Calculate height relative to water level (0-1 scale)
	const relativeHeight = (height - waterLevel) / (1 - waterLevel);

	// Determine terrain type based on relative height
	if (relativeHeight <= terrainBands.shore) return TerrainType.SHORE;
	if (relativeHeight <= terrainBands.beach) return TerrainType.BEACH;
	if (relativeHeight <= terrainBands.shrub) return TerrainType.SHRUB;
	if (relativeHeight <= terrainBands.forest) return TerrainType.FOREST;
	if (relativeHeight <= terrainBands.stone) return TerrainType.STONE;
	if (relativeHeight <= terrainBands.snow) return TerrainType.SNOW;
	return TerrainType.SNOW;
}

export function generateHexGrid(config: HexGridConfig): HexTile[] {
	const hexes = getHexesInRadius(config.radius);
	const { waterLevel } = config;

	// Calculate actual water level based on grid height
	const BASE_HEIGHT = 0;
	const actualWaterLevel = BASE_HEIGHT + waterLevel * config.gridHeight;

	// Setup noise
	const noise2D = createNoise2D();
	const noise2D2 = createNoise2D();
	const noise2D3 = createNoise2D();

	// Cache for height calculations
	const heightCache = new Map<string, number>();

	// Calculate height for a given coordinate
	const calculateHeight = (q: number, r: number, s: number): number => {
		const key = `${q},${r},${s}`;
		if (heightCache.has(key)) {
			return heightCache.get(key)!;
		}

		const x = q * 1.5;
		const z = (r * 2 + q) * 0.866;

		// Base height from primary noise
		let height =
			(noise2D(x * config.noiseScale, z * config.noiseScale) + 1) * 0.5;

		// Add detail with secondary noise
		height +=
			((noise2D2(x * config.noiseScale * 2, z * config.noiseScale * 2) + 1) *
				0.5 *
				config.noiseDetail) /
			2;

		// Add fuzziness with tertiary noise
		height +=
			((noise2D3(x * config.noiseScale * 4, z * config.noiseScale * 4) + 1) *
				0.5 *
				config.noiseFuzziness) /
			4;

		// Normalize to 0-1
		height = Math.max(0, Math.min(1, height));

		// Scale to grid height
		height = BASE_HEIGHT + height * config.gridHeight;

		heightCache.set(key, height);
		return height;
	};

	return hexes.map((hex: HexCoord) => {
		// Get or calculate height for current hex
		const height = calculateHeight(hex.q, hex.r, hex.s);
		const finalHeight = height < actualWaterLevel ? actualWaterLevel : height;

		// Determine terrain type using the new function
		const terrainType = getTerrainType(height / config.gridHeight, config);

		// Calculate water depth for water tiles
		const waterDepth =
			terrainType === TerrainType.WATER
				? Math.max(0, (height - BASE_HEIGHT) / (actualWaterLevel - BASE_HEIGHT))
				: 0;

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: finalHeight,
			terrainType,
			waterDepth,
		};
	});
}
