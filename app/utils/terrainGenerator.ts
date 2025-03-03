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
	const humidityNoise = createNoise2D(() => seed + 1);
	const temperatureNoise = createNoise2D(() => seed + 2);
	const peakNoise = createNoise2D(() => seed + 3); // Additional noise for mountain peaks

	// Define minimum base height that all terrain will extrude from
	const BASE_HEIGHT = 1;

	// Define water level - all water tiles will be at this height
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

		// Determine terrain type based on thresholds
		let terrainType: TerrainType;
		let terrainHeight: number;
		let heightRange: number;
		let prevThreshold: number = 0;
		let nextThreshold: number = 0;
		let waterDepth: number = 0;

		// Use the terrain thresholds to determine the terrain type
		if (elevation < TerrainThresholds[TerrainType.WATER]) {
			terrainType = TerrainType.WATER;
			// Calculate water depth as a normalized value (0-1)
			// The deeper the water, the closer to 0 this value will be
			waterDepth = elevation / TerrainThresholds[TerrainType.WATER];
			// All water tiles have the same height
			terrainHeight = 0; // Water level is the base reference
			heightRange = 0;
			nextThreshold = TerrainThresholds[TerrainType.WATER];
		} else if (elevation < TerrainThresholds[TerrainType.SHORE]) {
			terrainType = TerrainType.SHORE;
			terrainHeight = 0.02; // Just slightly above water
			heightRange = 0.01;
			prevThreshold = TerrainThresholds[TerrainType.WATER];
			nextThreshold = TerrainThresholds[TerrainType.SHORE];
		} else if (elevation < TerrainThresholds[TerrainType.BEACH]) {
			terrainType = TerrainType.BEACH;
			terrainHeight = 0.03; // A bit higher than shore
			heightRange = 0.02;
			prevThreshold = TerrainThresholds[TerrainType.SHORE];
			nextThreshold = TerrainThresholds[TerrainType.BEACH];
		} else if (elevation < TerrainThresholds[TerrainType.SHRUB]) {
			terrainType = TerrainType.SHRUB;
			terrainHeight = 0.05; // Gradually increasing
			heightRange = 0.03;
			prevThreshold = TerrainThresholds[TerrainType.BEACH];
			nextThreshold = TerrainThresholds[TerrainType.SHRUB];
		} else if (elevation < TerrainThresholds[TerrainType.FOREST]) {
			terrainType = TerrainType.FOREST;
			terrainHeight = 0.08; // Forests on higher ground
			heightRange = 0.04;
			prevThreshold = TerrainThresholds[TerrainType.SHRUB];
			nextThreshold = TerrainThresholds[TerrainType.FOREST];
		} else if (elevation < TerrainThresholds[TerrainType.STONE]) {
			terrainType = TerrainType.STONE;
			terrainHeight = 0.12; // Stone terrain significantly higher
			heightRange = 0.1;
			prevThreshold = TerrainThresholds[TerrainType.FOREST];
			nextThreshold = TerrainThresholds[TerrainType.STONE];
		} else {
			terrainType = TerrainType.SNOW;
			terrainHeight = 0.22; // Snow caps at highest elevation
			heightRange = 0.1; // Large range for dramatic peaks
			prevThreshold = TerrainThresholds[TerrainType.STONE];
			nextThreshold = TerrainThresholds[TerrainType.SNOW];
		}

		// Calculate normalized position within the current terrain range
		// This gives us a value from 0 to 1 representing where in the range this tile falls
		let normalizedPosition = 0;
		if (nextThreshold > prevThreshold) {
			normalizedPosition =
				(elevation - prevThreshold) / (nextThreshold - prevThreshold);
		}

		// Calculate the final height by adding a portion of the height range based on the normalized position
		// This creates natural variation within each terrain type
		let finalTerrainHeight = terrainHeight + normalizedPosition * heightRange;

		// Scale elevation by grid height and add the water level as base
		let scaledElevation = WATER_LEVEL + finalTerrainHeight * config.gridHeight;

		// For water tiles, use the fixed water level
		if (terrainType === TerrainType.WATER) {
			scaledElevation = WATER_LEVEL;
		}

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: scaledElevation,
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
