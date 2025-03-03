// Hex grid coordinate system
export interface HexCoord {
	q: number; // column
	r: number; // row
	s: number; // sum of q and r should be 0 (q + r + s = 0)
}

// Terrain types
export enum TerrainType {
	WATER = 'water',
	SHORE = 'shore',
	BEACH = 'beach',
	SHRUB = 'shrub',
	FOREST = 'forest',
	STONE = 'stone',
	SNOW = 'snow',
}

// Terrain colors
export const TerrainColors: Record<TerrainType, string> = {
	[TerrainType.WATER]: '#00a9ff',
	[TerrainType.SHORE]: '#ffd68f',
	[TerrainType.BEACH]: '#efb28f',
	[TerrainType.SHRUB]: '#9ea667',
	[TerrainType.FOREST]: '#586647',
	[TerrainType.STONE]: '#656565',
	[TerrainType.SNOW]: '#9aa7ad',
};

// Terrain thresholds
export const TerrainThresholds: Record<TerrainType, number> = {
	[TerrainType.WATER]: 0.21,
	[TerrainType.SHORE]: 0.25, // WATER + 0.01
	[TerrainType.BEACH]: 0.35, // SHORE + 0.04
	[TerrainType.SHRUB]: 0.46, // BEACH + 0.1
	[TerrainType.FOREST]: 0.65, // SHRUB + 0.29
	[TerrainType.STONE]: 0.83, // FOREST + 0.06
	[TerrainType.SNOW]: 1.0, // Maximum
};

// Hex tile data structure
export interface HexTile {
	id: string;
	coord: HexCoord;
	elevation: number;
	terrainType: TerrainType;
	waterDepth?: number;
}

// Hex grid configuration
export interface HexGridConfig {
	radius: number; // Number of rings from center
	hexSize: number; // Size of each hexagon
	gridHeight: number; // Height scale for elevation
	noiseScale: number; // Scale for Perlin noise
	noiseDetail: number; // Detail level for noise (0-1)
	noiseFuzziness: number; // Fuzziness of the noise (0-1)
	waterLevel: number; // Height threshold for water (0-1)
	// Terrain band thresholds
	terrainBands: {
		shore: number; // Shore band threshold
		beach: number; // Beach band threshold
		shrub: number; // Shrub band threshold
		forest: number; // Forest band threshold
		stone: number; // Stone band threshold
		snow: number; // Snow band threshold
	};
}

// Camera settings
export interface CameraConfig {
	position: [number, number, number];
	rotation: [number, number, number];
	fov: number;
}

// World settings
export interface WorldConfig {
	grid: HexGridConfig;
	camera: CameraConfig;
	seed: number; // Seed for reproducible noise
}
