import { createNoise2D, createNoise3D } from 'simplex-noise';
import { HexCoord, HexTile, TerrainType, HexGridConfig } from '../types';
import { getHexId, hexToPixel } from './hexUtils';

// Generate terrain for a hex grid
export function generateTerrain(
	hexes: HexCoord[],
	config: HexGridConfig,
	seed?: number
): HexTile[] {
	// Initialize noise functions with optional seed
	const elevationNoise = createNoise2D(() => seed || Math.random());
	const elevationNoise2 = createNoise2D(() =>
		seed ? seed + 0.5 : Math.random() + 0.5
	);
	const humidityNoise = createNoise2D(() => (seed ? seed + 1 : Math.random()));
	const temperatureNoise = createNoise2D(() =>
		seed ? seed + 2 : Math.random()
	);

	// Define minimum elevation value (as a fraction of gridHeight)
	const MIN_ELEVATION = 0.5;

	return hexes.map((hex) => {
		const [x, y] = hexToPixel(hex, config.hexSize);

		// Generate elevation using multiple octaves of Perlin noise for more natural terrain
		// First octave - large features
		const nx1 = x / (config.radius * config.hexSize * config.noiseScale * 2);
		const ny1 = y / (config.radius * config.hexSize * config.noiseScale * 2);
		const largeFeatures = (elevationNoise(nx1, ny1) + 1) / 2;

		// Second octave - medium features
		const nx2 = x / (config.radius * config.hexSize * config.noiseScale);
		const ny2 = y / (config.radius * config.hexSize * config.noiseScale);
		const mediumFeatures = (elevationNoise2(nx2, ny2) + 1) / 2;

		// Combine octaves with different weights for smoother terrain
		let normalizedElevation = largeFeatures * 0.7 + mediumFeatures * 0.3;

		// Apply some adjustments to create more interesting terrain
		// Distance from center creates a bowl shape for island-like terrain
		const centerDistanceFactor =
			1 -
			Math.sqrt(hex.q * hex.q + hex.r * hex.r + hex.s * hex.s) /
				(config.radius + 1);

		// Combine with distance factor to create island-like terrain
		// Use a gentler curve for smoother transitions
		let elevation = normalizedElevation * 0.7 + centerDistanceFactor * 0.3;

		// Add humidity and temperature variations with larger scale for smoother transitions
		const humidity = (humidityNoise(nx1, ny1) + 1) / 2;
		const temperature = (temperatureNoise(nx1, ny1) + 1) / 2;

		// Determine terrain type based on thresholds
		let terrainType: TerrainType;

		if (elevation < config.waterThreshold) {
			terrainType = TerrainType.WATER;
			// Set water to a consistent minimum level
			elevation = MIN_ELEVATION;
		} else if (elevation > config.mountainThreshold) {
			terrainType = TerrainType.MOUNTAIN;
			// Enhance mountain height but with a smoother curve
			elevation = Math.max(
				MIN_ELEVATION + 0.5,
				config.mountainThreshold + (elevation - config.mountainThreshold) * 1.2
			);
		} else if (
			elevation > config.waterThreshold + 0.1 &&
			humidity > config.forestThreshold
		) {
			terrainType = TerrainType.FOREST;
			// Keep forest elevation close to base terrain but ensure minimum
			elevation = Math.max(MIN_ELEVATION + 0.3, elevation * 1.05);
		} else if (
			elevation < config.waterThreshold + 0.15 &&
			humidity < config.sandThreshold
		) {
			terrainType = TerrainType.SAND;
			// Keep sand relatively flat but ensure minimum
			elevation = Math.max(MIN_ELEVATION + 0.1, config.waterThreshold + 0.1);
		} else {
			terrainType = TerrainType.LAND;
			// Ensure land has minimum elevation
			elevation = Math.max(MIN_ELEVATION + 0.2, elevation);
		}

		// Scale elevation by grid height
		const scaledElevation = elevation * config.gridHeight;

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
	switch (terrainType) {
		case TerrainType.WATER:
			// Deeper water is darker blue
			return `rgb(0, ${100 + normalizedElevation * 155}, ${
				170 + normalizedElevation * 85
			})`;
		case TerrainType.LAND:
			// Land gets greener as it gets higher
			return `rgb(${87 + normalizedElevation * 30}, ${
				139 + normalizedElevation * 40
			}, ${61 + normalizedElevation * 30})`;
		case TerrainType.FOREST:
			// Forest is darker green
			return `rgb(${34 + normalizedElevation * 20}, ${
				110 + normalizedElevation * 30
			}, ${43 + normalizedElevation * 20})`;
		case TerrainType.MOUNTAIN:
			// Mountains are gray/white as they get higher
			return `rgb(${120 + normalizedElevation * 135}, ${
				120 + normalizedElevation * 135
			}, ${120 + normalizedElevation * 135})`;
		case TerrainType.SAND:
			// Sand is yellow/tan
			return `rgb(${210 + normalizedElevation * 45}, ${
				180 + normalizedElevation * 30
			}, ${140 + normalizedElevation * 30})`;
		default:
			return '#888888';
	}
}
