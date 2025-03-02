import { createNoise2D } from 'simplex-noise';
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
	const humidityNoise = createNoise2D(() => (seed ? seed + 1 : Math.random()));
	const temperatureNoise = createNoise2D(() =>
		seed ? seed + 2 : Math.random()
	);

	return hexes.map((hex) => {
		const [x, y] = hexToPixel(hex, config.hexSize);

		// Generate elevation using Perlin noise
		const nx = x / (config.radius * config.hexSize * config.noiseScale);
		const ny = y / (config.radius * config.hexSize * config.noiseScale);

		// Create main elevation with Perlin noise (range -1 to 1)
		const baseElevation = elevationNoise(nx, ny);

		// Scale to 0-1 range
		const normalizedElevation = (baseElevation + 1) / 2;

		// Apply some adjustments to create more interesting terrain
		// Distance from center creates a bowl shape
		const centerDistanceFactor =
			1 -
			Math.sqrt(hex.q * hex.q + hex.r * hex.r + hex.s * hex.s) /
				(config.radius + 1);

		// Combine with distance factor to create island-like terrain
		// Enhance the elevation contrast by applying a power function
		let elevation = Math.pow(
			normalizedElevation * 0.8 + centerDistanceFactor * 0.2,
			1.2
		);

		// Add humidity and temperature variations
		const humidity = (humidityNoise(nx * 2, ny * 2) + 1) / 2;
		const temperature = (temperatureNoise(nx * 1.5, ny * 1.5) + 1) / 2;

		// Determine terrain type based on thresholds
		let terrainType: TerrainType;

		if (elevation < config.waterThreshold) {
			terrainType = TerrainType.WATER;
			// Flatten water level but keep a small amount of variation for waves
			elevation = config.waterThreshold * 0.2;
		} else if (elevation > config.mountainThreshold) {
			terrainType = TerrainType.MOUNTAIN;
			// Enhance mountain height
			elevation =
				config.mountainThreshold + (elevation - config.mountainThreshold) * 1.5;
		} else if (
			elevation > config.waterThreshold + 0.1 &&
			humidity > config.forestThreshold
		) {
			terrainType = TerrainType.FOREST;
			// Slightly enhance forest elevation
			elevation = elevation * 1.1;
		} else if (
			elevation < config.waterThreshold + 0.15 &&
			humidity < config.sandThreshold
		) {
			terrainType = TerrainType.SAND;
			// Keep sand relatively flat
			elevation = config.waterThreshold + 0.1;
		} else {
			terrainType = TerrainType.LAND;
		}

		return {
			id: getHexId(hex),
			coord: hex,
			elevation: elevation * config.gridHeight,
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
