# HexEngine

A procedurally generated hexagonal world engine built with Next.js and Three.js. This project creates beautiful 3D hexagonal landscapes with realistic terrain generation, featuring varied biomes and smooth transitions between different terrain types.

![HexEngine Preview](./public/hexengine-preview.png)

## Features

- **Advanced Terrain Generation**:
  - Multi-layered noise system with domain warping for natural-looking landscapes
  - Dynamic water systems with depth-based coloring
  - Intelligent terrain type transitions with cliff detection
  - Plateau detection for more realistic mountain formations
  - Snow caps on high peaks with natural transitions
- **Interactive World Settings**:
  - Adjustable world scale and terrain height
  - Fine-tuned control over terrain features:
    - Water level for varying island/continent sizes
    - Feature scale for controlling terrain granularity
    - Detail level for terrain roughness
    - Surface fuzziness for micro-variations
- **Terrain Types**:
  - Deep water with depth-based coloring
  - Shore and beach transitions
  - Shrubland and forests
  - Stone cliffs and mountains
  - Snow-capped peaks
- **Modern UI/UX**:
  - Responsive design for both desktop and mobile
  - Real-time terrain generation
  - Intuitive settings sidebar
  - Smooth camera controls with orbit capability

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

## World Generation

The world generation uses a sophisticated multi-layered approach:

1. **Base Terrain**: Uses simplex noise with domain warping to create natural-looking landmasses
2. **Regional Variations**: Additional noise layers determine regional characteristics like mountain ranges and valleys
3. **Local Features**: Fine detail noise adds local terrain variations and surface roughness
4. **Terrain Classification**: Advanced algorithms determine terrain types based on:
   - Elevation relative to water level
   - Proximity to water
   - Local slope calculations for cliff detection
   - Plateau detection for mountain formations
   - Regional mountain influence for snow placement

## Project Structure

- `/app/components/hexworld/`: React components for the hex grid and terrain visualization
- `/app/utils/`: Terrain generation and hex grid utility functions
- `/app/types/`: TypeScript type definitions

## Configuration

The world can be configured through the in-game UI, or programmatically in `app/page.tsx`. Key configuration options include:

```typescript
const defaultWorldConfigBase = {
	grid: {
		radius: 24, // World size
		hexSize: 1, // Size of each hex
		gridHeight: 14, // Maximum terrain height
		noiseScale: 1.35, // Base terrain feature size
		noiseDetail: 0.35, // Amount of detail variation
		noiseFuzziness: 0.4, // Surface roughness
		waterLevel: 0.3, // Water level (0-1)
		// Terrain bands control the elevation thresholds for different terrain types
		terrainBands: {
			shore: 0.1,
			beach: 0.2,
			shrub: 0.3,
			forest: 0.6,
			stone: 0.8,
			snow: 0.9,
		},
	},
	camera: {
		position: [0, 60, 80],
		rotation: [-Math.PI / 3, 0, 0],
		fov: 60,
	},
};
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Red Blob Games](https://www.redblobgames.com/grids/hexagons/) for hexagonal grid algorithms
- [three.js](https://threejs.org/) for 3D rendering
- [simplex-noise](https://www.npmjs.com/package/simplex-noise) for noise generation
