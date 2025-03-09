import { useRef } from 'react';
import { InstancedMesh, Object3D, Color, IcosahedronGeometry } from 'three';
import { HexTile, TerrainType } from '../../types';
import { useEffect } from 'react';

interface StoneProps {
  tiles: HexTile[];
  hexSize: number;
}

// Create low-poly rock geometry
const rockGeometry = new IcosahedronGeometry(0.2, 0);

// Pre-calculate transformations
const temp = new Object3D();
const color = new Color();

// Base colors for rocks
const BASE_STONE_COLOR = new Color('#656565');
const stoneHSL = { h: 0, s: 0, l: 0 };
BASE_STONE_COLOR.getHSL(stoneHSL);

// Distribution constants per terrain type (reduced probabilities)
const TERRAIN_STONE_PROBABILITY: Record<TerrainType, number> = {
  [TerrainType.WATER]: 0,
  [TerrainType.SHORE]: 0.05,
  [TerrainType.BEACH]: 0.08,
  [TerrainType.SHRUB]: 0.12,
  [TerrainType.FOREST]: 0.15,
  [TerrainType.STONE]: 0.4,  // Reduced from 0.7
  [TerrainType.SNOW]: 0.2,
};

// Cluster configuration
const STONES_PER_CLUSTER = 3;  // Reduced from 5
const CLUSTERS_PER_HEX_MAX = 1;  // Reduced from 2
const CLUSTER_RADIUS = 0.25;  // Slightly smaller clusters

// Scale configuration per terrain
const TERRAIN_SCALE: Record<TerrainType, { min: number; max: number; }> = {
  [TerrainType.WATER]: { min: 0, max: 0 },
  [TerrainType.SHORE]: { min: 0.4, max: 0.6 },
  [TerrainType.BEACH]: { min: 0.4, max: 0.7 },
  [TerrainType.SHRUB]: { min: 0.5, max: 0.8 },
  [TerrainType.FOREST]: { min: 0.6, max: 0.9 },
  [TerrainType.STONE]: { min: 1.0, max: 1.8 },  // Much larger stones
  [TerrainType.SNOW]: { min: 0.7, max: 1.1 },
};

// Deterministic random function based on coordinates
const getRandomFromCoords = (q: number, r: number, seed: number = 0): number => {
  return Math.abs(Math.sin(q * 12.9898 + r * 78.233 + seed) * 43758.5453) % 1;
};

export default function Stone({ tiles, hexSize }: StoneProps) {
  const stoneRef = useRef<InstancedMesh>(null);

  // Filter tiles and calculate stone instances
  const stoneTiles = tiles.filter(tile => {
    if (tile.terrainType === TerrainType.WATER) return false;
    const probability = TERRAIN_STONE_PROBABILITY[tile.terrainType];
    const random = getRandomFromCoords(tile.coord.q, tile.coord.r);
    return random < probability;
  });

  // Calculate maximum possible stones (we'll use fewer in practice)
  const maxStoneCount = stoneTiles.length * CLUSTERS_PER_HEX_MAX * STONES_PER_CLUSTER;

  useEffect(() => {
    const stone = stoneRef.current;
    if (!stone) return;

    let instanceIndex = 0;

    stoneTiles.forEach((tile) => {
      // Determine number of clusters for this tile
      const clusterRandom = getRandomFromCoords(tile.coord.q, tile.coord.r, 1);

      // Stone terrain gets fewer clusters but guaranteed at least one
      const maxClusters = tile.terrainType === TerrainType.STONE ? 1 : CLUSTERS_PER_HEX_MAX;
      const actualClusters = tile.terrainType === TerrainType.STONE ? 1 :
        Math.floor(clusterRandom * maxClusters) + 1;

      // Base position for this hex
      const baseX = hexSize * (3 / 2 * tile.coord.q);
      const baseZ = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);
      const baseY = tile.elevation;

      // Create stone clusters
      for (let cluster = 0; cluster < actualClusters; cluster++) {
        // Position for this cluster
        const clusterAngle = (cluster / actualClusters) * Math.PI * 2 +
          getRandomFromCoords(tile.coord.q, tile.coord.r, cluster) * Math.PI;
        const clusterRadius = getRandomFromCoords(tile.coord.q, tile.coord.r, cluster + 0.5) * 0.5 * hexSize;
        const clusterX = baseX + Math.cos(clusterAngle) * clusterRadius;
        const clusterZ = baseZ + Math.sin(clusterAngle) * clusterRadius;

        // Number of stones in this cluster varies by terrain
        const stonesInCluster = tile.terrainType === TerrainType.STONE ?
          Math.max(1, Math.floor(STONES_PER_CLUSTER * 0.6)) : // Fewer stones in stone terrain
          Math.max(1, Math.floor(STONES_PER_CLUSTER * (TERRAIN_STONE_PROBABILITY[tile.terrainType] + 0.3)));

        // Create stones in this cluster
        for (let i = 0; i < stonesInCluster; i++) {
          // Random position within cluster
          const stoneAngle = getRandomFromCoords(tile.coord.q, tile.coord.r, i + cluster * 0.1) * Math.PI * 2;
          const stoneRadius = getRandomFromCoords(tile.coord.q, tile.coord.r, i * 0.1) * CLUSTER_RADIUS;
          const x = clusterX + Math.cos(stoneAngle) * stoneRadius;
          const z = clusterZ + Math.sin(stoneAngle) * stoneRadius;
          const y = baseY + 0.1; // Slightly above ground

          // Get scale range for this terrain type
          const { min, max } = TERRAIN_SCALE[tile.terrainType];
          const scale = min + getRandomFromCoords(tile.coord.q, tile.coord.r, i + 0.3) * (max - min);

          // Position and rotate stone
          temp.position.set(x, y, z);
          temp.rotation.set(
            getRandomFromCoords(tile.coord.q, tile.coord.r, i + 0.9) * Math.PI,
            getRandomFromCoords(tile.coord.q, tile.coord.r, i + 1.1) * Math.PI,
            getRandomFromCoords(tile.coord.q, tile.coord.r, i + 1.3) * Math.PI
          );
          temp.scale.setScalar(scale);
          temp.updateMatrix();
          stone.setMatrixAt(instanceIndex, temp.matrix);

          // Vary colors slightly based on terrain
          const terrainFactor = tile.terrainType === TerrainType.STONE ? 1 : 0.8;
          const hue = stoneHSL.h;
          const saturation = stoneHSL.s * terrainFactor;
          const lightness = Math.max(0.2, Math.min(0.6,
            stoneHSL.l * terrainFactor +
            (getRandomFromCoords(tile.coord.q, tile.coord.r, i + 1.5) - 0.5) * 0.1
          ));
          color.setHSL(hue, saturation, lightness);
          stone.setColorAt(instanceIndex, color);

          instanceIndex++;
        }
      }
    });

    // Update buffers
    stone.instanceMatrix.needsUpdate = true;
    if (stone.instanceColor) stone.instanceColor.needsUpdate = true;
  }, [tiles, hexSize, stoneTiles]);

  return (
    <instancedMesh
      ref={stoneRef}
      args={[rockGeometry, undefined, maxStoneCount]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial roughness={0.8} metalness={0.2} />
    </instancedMesh>
  );
} 