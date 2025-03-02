// Hex grid coordinate system
export interface HexCoord {
	q: number; // column
	r: number; // row
	s: number; // sum of q and r should be 0 (q + r + s = 0)
}

// Terrain types
export enum TerrainType {
	WATER = 'water',
	LAND = 'land',
	FOREST = 'forest',
	MOUNTAIN = 'mountain',
	SAND = 'sand',
}

// Hex tile data structure
export interface HexTile {
	id: string;
	coord: HexCoord;
	elevation: number;
	terrainType: TerrainType;
	humidity: number;
	temperature: number;
	isSelected?: boolean;
}

// Hex grid configuration
export interface HexGridConfig {
	radius: number; // Number of rings from center
	hexSize: number; // Size of each hexagon
	gridHeight: number; // Height scale for elevation
	noiseScale: number; // Scale for Perlin noise
	waterThreshold: number; // Elevation threshold for water
	forestThreshold: number; // Combined elevation/humidity threshold for forests
	mountainThreshold: number; // Elevation threshold for mountains
	sandThreshold: number; // Combined elevation/humidity threshold for sand
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
	seed?: number; // Optional seed for reproducible noise
}
