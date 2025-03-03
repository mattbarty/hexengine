import { createNoise2D, createNoise3D } from 'simplex-noise';
import {
	HexCoord,
	HexTile,
	TerrainType,
	HexGridConfig,
	TerrainColors,
	TerrainThresholds,
} from '../types';
import { getHexId, hexToPixel } from './hexUtils';

// Generate terrain for a hex grid
export function generateTerrain(
	hexes: HexCoord[],
	config: HexGridConfig,
	seed: number
): HexTile[] {
	// Initialize noise functions with seed
	const elevationNoise = createNoise2D(() => seed);
	const elevationNoise2 = createNoise2D(() => seed + 0.5);

	// Define minimum base height that all terrain will extrude from
	const BASE_HEIGHT = 1.5;

	// Pre-calculate heights for all hexes in a map to avoid recalculation
	const heightMap = new Map<string, number>();

	// Helper to calculate height for a hex
	const calculateHeight = (q: number, r: number, s: number): number => {
		const key = `${q},${r},${s}`;
		if (heightMap.has(key)) {
			return heightMap.get(key)!;
		}

		// Skip if outside grid
		if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > config.radius) {
			return Infinity;
		}

		const [x, y] = hexToPixel({ q, r, s }, config.hexSize);

		// First octave - large features
		const nx1 = x / (config.radius * config.hexSize * config.noiseScale * 2);
		const ny1 = y / (config.radius * config.hexSize * config.noiseScale * 2);
		const largeFeatures = (elevationNoise(nx1, ny1) + 1) / 2;

		// Second octave - medium features
		const nx2 = x / (config.radius * config.hexSize * config.noiseScale);
		const ny2 = y / (config.radius * config.hexSize * config.noiseScale);
		const mediumFeatures =
			(elevationNoise2(nx2 * config.noiseDetail, ny2 * config.noiseDetail) +
				1) /
			2;

		// Calculate elevation
		const normalizedElevation =
			largeFeatures * (1 - config.noiseFuzziness) +
			mediumFeatures * config.noiseFuzziness;

		const centerDistanceFactor =
			1 - Math.sqrt(q * q + r * r + s * s) / (config.radius + 1);
		const elevation = normalizedElevation * 0.8 + centerDistanceFactor * 0.3;
		const height = BASE_HEIGHT + elevation * config.gridHeight;

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
	const STONE_BAND = 0.8 + 0.1 * (1 - waterLevelFactor);
	const SNOW_BAND = 0.85;

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

		// Optimized water proximity check
		let waterProximity = 0;

		// Check first ring
		for (const [dq, dr, ds] of ring1Offsets) {
			const nHeight = calculateHeight(hex.q + dq, hex.r + dr, hex.s + ds);
			if (nHeight < actualWaterLevel) {
				waterProximity = 1;
				break;
			}
		}

		// Only check second ring if needed
		if (waterProximity === 0) {
			for (const [dq, dr, ds] of ring2Offsets) {
				const nHeight = calculateHeight(hex.q + dq, hex.r + dr, hex.s + ds);
				if (nHeight < actualWaterLevel) {
					waterProximity = 0.5;
					break;
				}
			}
		}

		// Determine terrain type
		let terrainType: TerrainType;
		if (normalizedHeightAboveWater < SHORE_BAND && waterProximity > 0) {
			terrainType = TerrainType.SHORE;
		} else if (normalizedHeightAboveWater < BEACH_BAND && waterProximity > 0) {
			terrainType = TerrainType.BEACH;
		} else if (normalizedHeightAboveWater < SHRUB_BAND) {
			terrainType = TerrainType.SHRUB;
		} else if (normalizedHeightAboveWater < FOREST_BAND) {
			terrainType = TerrainType.FOREST;
		} else if (normalizedHeightAboveWater < STONE_BAND) {
			terrainType = TerrainType.STONE;
		} else if (normalizedHeightAboveWater < SNOW_BAND) {
			terrainType = TerrainType.STONE;
		} else {
			terrainType = TerrainType.SNOW;
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
