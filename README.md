# HexEngine

A procedurally generated hexagonal world engine built with Next.js and Three.js. This project creates a 3D hexagonal grid with terrain generated using Perlin noise, similar to strategy games like Civilization.

![HexEngine Preview](./public/hexengine-preview.png)

## Features

- **Procedural Terrain Generation**: Using Perlin noise to create realistic, varied terrain
- **Hexagonal Grid System**: Efficient cube coordinate system for hex grid operations
- **Terrain Types**: Water, land, forest, mountain, and sand biomes
- **Interactive UI**: Click tiles to view detailed information
- **3D Environment**: Beautiful rendering with Three.js, including lighting, shadows, and sky
- **Modular Architecture**: Designed for easy extension with game mechanics

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/hexengine.git
   cd hexengine
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Run the development server

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

You can modify the world configuration in `app/page.tsx`:

```typescript
const defaultWorldConfig: WorldConfig = {
	grid: {
		radius: 10, // Number of hex rings from center
		hexSize: 1, // Size of each hex
		gridHeight: 5, // Maximum elevation
		noiseScale: 0.5, // Scale for Perlin noise
		waterThreshold: 0.4, // Elevation threshold for water
		forestThreshold: 0.6, // Humidity threshold for forests
		mountainThreshold: 0.7, // Elevation threshold for mountains
		sandThreshold: 0.3, // Humidity threshold for sand
	},
	camera: {
		position: [0, 15, 20],
		rotation: [-Math.PI / 4, 0, 0],
		fov: 50,
	},
	seed: 12345, // Optional seed for reproducible terrain
};
```

## Project Structure

- `/app/components/hexworld/`: React components for the hex grid and world
- `/app/utils/`: Utility functions for hex grid operations and terrain generation
- `/app/types/`: TypeScript type definitions

## Future Enhancements

- Path finding and movement
- Resources and resource gathering
- Units and buildings
- Turn-based gameplay
- Combat system
- Multiplayer support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Red Blob Games](https://www.redblobgames.com/grids/hexagons/) for hexagonal grid algorithms
- [three.js](https://threejs.org/) for 3D rendering
- [simplex-noise](https://www.npmjs.com/package/simplex-noise) for Perlin noise generation
