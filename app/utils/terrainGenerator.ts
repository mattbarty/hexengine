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

	// Define minimum elevation value (as a fraction of gridHeight)
	const MIN_ELEVATION = 0.3;

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
		let elevation = normalizedElevation * 0.7 + centerDistanceFactor * 0.3;

		// Add humidity and temperature variations with larger scale for smoother transitions
		const humidity = (humidityNoise(nx1, ny1) + 1) / 2;
		const temperature = (temperatureNoise(nx1, ny1) + 1) / 2;

		// Determine terrain type based on thresholds
		let terrainType: TerrainType;
		let terrainHeight: number;

		// Use the terrain thresholds to determine the terrain type
		if (elevation < TerrainThresholds[TerrainType.WATER]) {
			terrainType = TerrainType.WATER;
			// Set water to a consistent minimum level
			terrainHeight = 0.05;
		} else if (elevation < TerrainThresholds[TerrainType.SHORE]) {
			terrainType = TerrainType.SHORE;
			terrainHeight = 0.1;
		} else if (elevation < TerrainThresholds[TerrainType.BEACH]) {
			terrainType = TerrainType.BEACH;
			terrainHeight = 0.15;
		} else if (elevation < TerrainThresholds[TerrainType.SHRUB]) {
			terrainType = TerrainType.SHRUB;
			terrainHeight = 0.2;
		} else if (elevation < TerrainThresholds[TerrainType.FOREST]) {
			terrainType = TerrainType.FOREST;
			terrainHeight = 0.3;
		} else if (elevation < TerrainThresholds[TerrainType.STONE]) {
			terrainType = TerrainType.STONE;
			terrainHeight = 0.4;
		} else {
			terrainType = TerrainType.SNOW;
			terrainHeight = 0.5;
		}

		// Scale elevation by grid height
		// We want to ensure that all tiles start from the same base level (0)
		// and extend upward based on their terrain type
		const scaledElevation = terrainHeight * config.gridHeight;

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: scaledElevation,
			terrainType,
			humidity,
			temperature,
			isSelected: false,
		};
	});
}

// Get the color for a terrain type
export function getTerrainColor(
	terrainType: TerrainType,
	elevation: number,
	normalizedElevation: number
): string {
	// Use the predefined colors from TerrainColors
	return TerrainColors[terrainType];
}
