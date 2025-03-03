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

	// Define water level for terrain type determination
	const WATER_LEVEL = BASE_HEIGHT + 0.1 * config.gridHeight;

	return hexes.map((hex) => {
		const [x, y] = hexToPixel(hex, config.hexSize);

		// Generate elevation using multiple octaves of Perlin noise for more natural terrain
		// First octave - large features
		const nx1 = x / (config.radius * config.hexSize * config.noiseScale * 2);
		const ny1 = y / (config.radius * config.hexSize * config.noiseScale * 2);
		const largeFeatures = (elevationNoise(nx1, ny1) + 1) / 2;

		// Second octave - medium features with detail parameter
		const nx2 = x / (config.radius * config.hexSize * config.noiseScale);
		const ny2 = y / (config.radius * config.hexSize * config.noiseScale);
		const mediumFeatures =
			(elevationNoise2(nx2 * config.noiseDetail, ny2 * config.noiseDetail) +
				1) /
			2;

		// Combine octaves with different weights for smoother terrain
		// Use fuzziness parameter to control the blend
		let normalizedElevation =
			largeFeatures * (1 - config.noiseFuzziness) +
			mediumFeatures * config.noiseFuzziness;

		// Apply some adjustments to create more interesting terrain
		// Distance from center creates a bowl shape for island-like terrain
		const centerDistanceFactor =
			1 -
			Math.sqrt(hex.q * hex.q + hex.r * hex.r + hex.s * hex.s) /
				(config.radius + 1);

		// Combine with distance factor to create island-like terrain
		let elevation = normalizedElevation * 0.8 + centerDistanceFactor * 0.3;

		// Calculate the actual height from the noise
		const height = BASE_HEIGHT + elevation * config.gridHeight;

		// Calculate the actual water level height
		const actualWaterLevel =
			BASE_HEIGHT + config.waterLevel * config.gridHeight;

		// For points below water, set their visual height to exactly the water level
		const finalHeight = height < actualWaterLevel ? actualWaterLevel : height;

		// Calculate height relative to water level using ORIGINAL height for water detection
		const heightAboveWater = height - actualWaterLevel;
		const normalizedHeightAboveWater = heightAboveWater / config.gridHeight;

		// Calculate relative height (0-1 scale) using the final height for terrain bands
		const heightAboveBase = finalHeight - BASE_HEIGHT;
		const relativeHeight = heightAboveBase / config.gridHeight;

		// Define dynamic terrain bands based on water level
		// When water level is low, expand middle terrain types
		// When water level is high, compress middle terrain types
		const waterLevelFactor = Math.max(0.2, Math.min(0.8, config.waterLevel));

		// Helper function to check if a hex is within range of water
		const getWaterProximity = () => {
			// Check two rings of hexes
			const ring1 = [
				{ q: hex.q + 1, r: hex.r - 1, s: hex.s },
				{ q: hex.q + 1, r: hex.r, s: hex.s - 1 },
				{ q: hex.q, r: hex.r + 1, s: hex.s - 1 },
				{ q: hex.q - 1, r: hex.r + 1, s: hex.s },
				{ q: hex.q - 1, r: hex.r, s: hex.s + 1 },
				{ q: hex.q, r: hex.r - 1, s: hex.s + 1 },
			];

			const ring2 = [
				{ q: hex.q + 2, r: hex.r - 2, s: hex.s },
				{ q: hex.q + 2, r: hex.r - 1, s: hex.s - 1 },
				{ q: hex.q + 2, r: hex.r, s: hex.s - 2 },
				{ q: hex.q + 1, r: hex.r + 1, s: hex.s - 2 },
				{ q: hex.q, r: hex.r + 2, s: hex.s - 2 },
				{ q: hex.q - 1, r: hex.r + 2, s: hex.s - 1 },
				{ q: hex.q - 2, r: hex.r + 2, s: hex.s },
				{ q: hex.q - 2, r: hex.r + 1, s: hex.s + 1 },
				{ q: hex.q - 2, r: hex.r, s: hex.s + 2 },
				{ q: hex.q - 1, r: hex.r - 1, s: hex.s + 2 },
				{ q: hex.q, r: hex.r - 2, s: hex.s + 2 },
				{ q: hex.q + 1, r: hex.r - 2, s: hex.s + 1 },
			];

			let proximity = 0;

			// Check first ring (immediate neighbors)
			const hasAdjacentWater = ring1.some((n) => {
				if (
					Math.max(Math.abs(n.q), Math.abs(n.r), Math.abs(n.s)) > config.radius
				) {
					return false;
				}
				const [nx, ny] = hexToPixel(n, config.hexSize);
				const nNoise1 =
					(elevationNoise(
						nx / (config.radius * config.hexSize * config.noiseScale * 2),
						ny / (config.radius * config.hexSize * config.noiseScale * 2)
					) +
						1) /
					2;
				const nNoise2 =
					(elevationNoise2(
						(nx / (config.radius * config.hexSize * config.noiseScale)) *
							config.noiseDetail,
						(ny / (config.radius * config.hexSize * config.noiseScale)) *
							config.noiseDetail
					) +
						1) /
					2;

				const nElevation =
					(nNoise1 * (1 - config.noiseFuzziness) +
						nNoise2 * config.noiseFuzziness) *
						0.8 +
					(1 -
						Math.sqrt(n.q * n.q + n.r * n.r + n.s * n.s) /
							(config.radius + 1)) *
						0.3;

				const nHeight = BASE_HEIGHT + nElevation * config.gridHeight;
				return nHeight < actualWaterLevel;
			});

			if (hasAdjacentWater) return 1;

			// Check second ring if no adjacent water
			const hasNearbyWater = ring2.some((n) => {
				if (
					Math.max(Math.abs(n.q), Math.abs(n.r), Math.abs(n.s)) > config.radius
				) {
					return false;
				}
				const [nx, ny] = hexToPixel(n, config.hexSize);
				const nNoise1 =
					(elevationNoise(
						nx / (config.radius * config.hexSize * config.noiseScale * 2),
						ny / (config.radius * config.hexSize * config.noiseScale * 2)
					) +
						1) /
					2;
				const nNoise2 =
					(elevationNoise2(
						(nx / (config.radius * config.hexSize * config.noiseScale)) *
							config.noiseDetail,
						(ny / (config.radius * config.hexSize * config.noiseScale)) *
							config.noiseDetail
					) +
						1) /
					2;

				const nElevation =
					(nNoise1 * (1 - config.noiseFuzziness) +
						nNoise2 * config.noiseFuzziness) *
						0.8 +
					(1 -
						Math.sqrt(n.q * n.q + n.r * n.r + n.s * n.s) /
							(config.radius + 1)) *
						0.3;

				const nHeight = BASE_HEIGHT + nElevation * config.gridHeight;
				return nHeight < actualWaterLevel;
			});

			return hasNearbyWater ? 0.5 : 0;
		};

		// Adjust band sizes based on water level
		const SHORE_BAND = 0.08; // Increased from 0.05
		const BEACH_BAND = 0.15 + 0.2 * (1 - waterLevelFactor); // Increased from 0.1 + 0.15
		const SHRUB_BAND = 0.15 + 0.1 * (1 - waterLevelFactor); // Adjusted to accommodate larger beach
		const FOREST_BAND = 0.5 + 0.25 * (1 - waterLevelFactor);
		const STONE_BAND = 0.7 + 0.2 * (1 - waterLevelFactor);

		// Determine terrain type based on height relative to water and proximity
		let terrainType: TerrainType;
		let waterDepth: number = 0;

		if (height < actualWaterLevel) {
			terrainType = TerrainType.WATER;
			waterDepth = Math.max(
				0,
				(height - BASE_HEIGHT) / (actualWaterLevel - BASE_HEIGHT)
			);
		} else {
			// Get water proximity (1 for adjacent, 0.5 for nearby, 0 for far)
			const waterProximity = getWaterProximity();

			if (normalizedHeightAboveWater < SHORE_BAND && waterProximity > 0) {
				terrainType = TerrainType.SHORE;
			} else if (
				normalizedHeightAboveWater < BEACH_BAND &&
				waterProximity > 0
			) {
				terrainType = TerrainType.BEACH;
			} else if (normalizedHeightAboveWater < SHRUB_BAND) {
				terrainType = TerrainType.SHRUB;
			} else if (normalizedHeightAboveWater < FOREST_BAND) {
				terrainType = TerrainType.FOREST;
			} else if (
				normalizedHeightAboveWater < STONE_BAND ||
				waterLevelFactor < 0.4
			) {
				terrainType = TerrainType.STONE;
			} else {
				terrainType = TerrainType.SNOW;
			}
		}

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: finalHeight, // Use the flat water level for visual height
			terrainType,
			waterDepth: terrainType === TerrainType.WATER ? waterDepth : 0,
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
