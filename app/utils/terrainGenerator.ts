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

		// Determine terrain type based on height relative to water level
		let terrainType: TerrainType;
		let waterDepth: number = 0;

		// Calculate how high above base level we are
		const heightAboveBase = height - BASE_HEIGHT;
		const relativeHeight = heightAboveBase / config.gridHeight; // This will be 0-1

		// Determine terrain type based on relative height
		if (relativeHeight < TerrainThresholds[TerrainType.WATER]) {
			terrainType = TerrainType.WATER;
			waterDepth = relativeHeight / TerrainThresholds[TerrainType.WATER];
		} else if (relativeHeight < TerrainThresholds[TerrainType.SHORE]) {
			terrainType = TerrainType.SHORE;
		} else if (relativeHeight < TerrainThresholds[TerrainType.BEACH]) {
			terrainType = TerrainType.BEACH;
		} else if (relativeHeight < TerrainThresholds[TerrainType.SHRUB]) {
			terrainType = TerrainType.SHRUB;
		} else if (relativeHeight < TerrainThresholds[TerrainType.FOREST]) {
			terrainType = TerrainType.FOREST;
		} else if (relativeHeight < TerrainThresholds[TerrainType.STONE]) {
			terrainType = TerrainType.STONE;
		} else {
			terrainType = TerrainType.SNOW;
		}

		// Use natural height for all terrain types including water
		const finalHeight = height;

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: finalHeight,
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
