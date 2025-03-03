import { useRef } from 'react';
import { InstancedMesh, Object3D, Color, CylinderGeometry, Vector3 } from 'three';
import { HexTile, TerrainType } from '../../types';
import { useEffect } from 'react';

interface GrassProps {
  tiles: HexTile[];
  hexSize: number;
}

// Create simple blade geometry - tapered cylinder for performance
const bladeGeometry = new CylinderGeometry(0.02, 0.05, 0.4, 3);
// Tilt the geometry so blades lean slightly
bladeGeometry.translate(0, 0.2, 0);
bladeGeometry.rotateX(Math.PI * 0.1);

// Pre-calculate transformations
const temp = new Object3D();
const color = new Color();

// Base colors derived from terrain palette
const BASE_GRASS_COLOR = new Color('#9ea667'); // Match shrub terrain color
const grassHSL = { h: 0, s: 0, l: 0 };
BASE_GRASS_COLOR.getHSL(grassHSL);

// Distribution constants
const GRASS_DENSITY = 8; // Reduced blades per cluster
const CLUSTERS_PER_HEX = 3; // Fewer clusters per hex
const CLUSTER_RADIUS = 0.25; // Slightly smaller clusters
const GRASS_PROBABILITY = 0.6; // Only 60% of shrub tiles get grass

// Deterministic random function based on coordinates
const getRandomFromCoords = (q: number, r: number, seed: number = 0): number => {
  return Math.abs(Math.sin(q * 12.9898 + r * 78.233 + seed) * 43758.5453) % 1;
};

export default function Grass({ tiles, hexSize }: GrassProps) {
  const grassRef = useRef<InstancedMesh>(null);

  // Filter tiles that should have grass using deterministic randomization
  const grassTiles = tiles.filter(tile => {
    if (tile.terrainType !== TerrainType.SHRUB) return false;
    const random = getRandomFromCoords(tile.coord.q, tile.coord.r);
    return random < GRASS_PROBABILITY;
  });

  // Count total grass instances needed
  const totalGrassCount = grassTiles.length * CLUSTERS_PER_HEX * GRASS_DENSITY;

  useEffect(() => {
    const grass = grassRef.current;
    if (!grass) return;

    let instanceIndex = 0;

    grassTiles.forEach((tile) => {
      // Get deterministic random value for this tile
      const tileRandom = getRandomFromCoords(tile.coord.q, tile.coord.r, 1);
      const actualClusters = Math.max(1, Math.floor(CLUSTERS_PER_HEX * tileRandom + 1));

      // Base position for this hex
      const baseX = hexSize * (3 / 2 * tile.coord.q);
      const baseZ = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);
      const baseY = tile.elevation;

      // Create clusters of grass
      for (let cluster = 0; cluster < actualClusters; cluster++) {
        // Position for this cluster
        const clusterAngle = (cluster / actualClusters) * Math.PI * 2 +
          getRandomFromCoords(tile.coord.q, tile.coord.r, cluster) * Math.PI;
        const clusterRadius = getRandomFromCoords(tile.coord.q, tile.coord.r, cluster + 0.5) * 0.5 * hexSize;
        const clusterX = baseX + Math.cos(clusterAngle) * clusterRadius;
        const clusterZ = baseZ + Math.sin(clusterAngle) * clusterRadius;

        // Create grass blades in this cluster
        for (let blade = 0; blade < GRASS_DENSITY; blade++) {
          // Random position within cluster
          const bladeAngle = getRandomFromCoords(tile.coord.q, tile.coord.r, blade + cluster * 0.1) * Math.PI * 2;
          const bladeRadius = getRandomFromCoords(tile.coord.q, tile.coord.r, blade * 0.1) * CLUSTER_RADIUS;
          const x = clusterX + Math.cos(bladeAngle) * bladeRadius;
          const z = clusterZ + Math.sin(bladeAngle) * bladeRadius;
          const y = baseY;

          // Random scale and rotation for variety
          const scale = 0.6 + getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 0.3) * 0.4;
          const rotation = getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 0.7) * Math.PI * 2;

          // Position and rotate blade
          temp.position.set(x, y, z);
          temp.rotation.set(
            Math.PI * 0.1 * (getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 0.9) - 0.5),
            rotation,
            Math.PI * 0.1 * (getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 1.1) - 0.5)
          );
          temp.scale.set(scale, scale + getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 1.3) * 0.2, scale);
          temp.updateMatrix();
          grass.setMatrixAt(instanceIndex, temp.matrix);

          // Vary colors slightly
          const hue = grassHSL.h + (getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 1.5) - 0.5) * 0.05;
          const saturation = Math.min(1, grassHSL.s + (getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 1.7) - 0.3) * 0.1);
          const lightness = Math.max(0.3, Math.min(0.5, grassHSL.l + (getRandomFromCoords(tile.coord.q, tile.coord.r, blade + 1.9) - 0.5) * 0.1));
          color.setHSL(hue, saturation, lightness);
          grass.setColorAt(instanceIndex, color);

          instanceIndex++;
        }
      }
    });

    // Update buffers
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  }, [tiles, hexSize]);

  return (
    <instancedMesh
      ref={grassRef}
      args={[bladeGeometry, undefined, totalGrassCount]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial />
    </instancedMesh>
  );
} 