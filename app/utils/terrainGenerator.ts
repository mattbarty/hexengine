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

		// Adjust band sizes based on water level
		const SHORE_BAND = 0.05; // Shore always stays small for realism
		const BEACH_BAND = 0.1 + 0.15 * (1 - waterLevelFactor); // Beaches expand when water is low
		const SHRUB_BAND = 0.25 + 0.2 * (1 - waterLevelFactor); // Shrubland expands when water is low
		const FOREST_BAND = 0.45 + 0.25 * (1 - waterLevelFactor); // Forest expands when water is low
		const STONE_BAND = 0.7 + 0.2 * (1 - waterLevelFactor); // Stone becomes more prevalent with low water
		// Snow only appears when water level is higher (more mountainous terrain)

		// Determine terrain type based on height relative to water
		let terrainType: TerrainType;
		let waterDepth: number = 0;

		if (height < actualWaterLevel) {
			terrainType = TerrainType.WATER;
			// Calculate water depth based on the original terrain height
			waterDepth = Math.max(
				0,
				(height - BASE_HEIGHT) / (actualWaterLevel - BASE_HEIGHT)
			);
		} else if (normalizedHeightAboveWater < SHORE_BAND) {
			terrainType = TerrainType.SHORE;
		} else if (normalizedHeightAboveWater < BEACH_BAND) {
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
