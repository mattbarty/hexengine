import { useRef } from 'react';
import { InstancedMesh, Object3D, Color, CylinderGeometry, ConeGeometry } from 'three';
import { HexTile, TerrainType } from '../../types';
import { useEffect } from 'react';

interface TreeProps {
  tiles: HexTile[];
  hexSize: number;
}

// Create geometries once and reuse
const trunkGeometry = new CylinderGeometry(0.15, 0.2, 1, 6);
const leavesGeometry = new ConeGeometry(0.8, 1.5, 6);

// Pre-calculate transformations
const temp = new Object3D();
const color = new Color();

// Base colors derived from terrain palette
const TRUNK_COLOR = '#2a1f15'; // Even darker brown
const BASE_LEAF_COLOR = new Color('#3d4431'); // Darker forest green
const leafHSL = { h: 0, s: 0, l: 0 };
BASE_LEAF_COLOR.getHSL(leafHSL);

// Natural distribution constants
const TREE_DENSITY = 0.6; // Reduce overall density
const MIN_TREES_PER_HEX = 0;
const MAX_TREES_PER_HEX = 3;

export default function Tree({ tiles, hexSize }: TreeProps) {
  const trunkRef = useRef<InstancedMesh>(null);
  const leavesRef = useRef<InstancedMesh>(null);

  // Calculate trees per hex based on noise and position
  const getTreesPerHex = (q: number, r: number): number => {
    // Use coordinates to create a pseudo-random but consistent number
    const noiseVal = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
    const normalized = (noiseVal - Math.floor(noiseVal));

    // Apply density factor and clamp to min/max
    return Math.floor(
      Math.max(MIN_TREES_PER_HEX,
        Math.min(MAX_TREES_PER_HEX,
          normalized * MAX_TREES_PER_HEX * TREE_DENSITY))
    );
  };

  // Count total trees needed
  const totalTrees = tiles
    .filter(tile => tile.terrainType === TerrainType.FOREST)
    .reduce((sum, tile) => sum + getTreesPerHex(tile.coord.q, tile.coord.r), 0);

  useEffect(() => {
    const trunk = trunkRef.current;
    const leaves = leavesRef.current;
    if (!trunk || !leaves) return;

    let treeIndex = 0;

    // Update instances - only for forest tiles
    const forestTiles = tiles.filter(tile => tile.terrainType === TerrainType.FOREST);

    forestTiles.forEach((tile) => {
      const treesInHex = getTreesPerHex(tile.coord.q, tile.coord.r);

      for (let i = 0; i < treesInHex; i++) {
        // Base position for this hex
        const x = hexSize * (3 / 2 * tile.coord.q);
        const z = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);
        const y = tile.elevation;

        // More varied random offset within hex
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.7 * hexSize; // Larger radius for more spread
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;

        // More varied tree sizes
        const sizeVariation = 0.6 + Math.random() * 0.8; // 0.6 to 1.4 size range

        // Trunk
        temp.position.set(x + offsetX, y + 0.5, z + offsetZ);
        temp.rotation.y = Math.random() * Math.PI * 2;
        temp.scale.setScalar(sizeVariation);
        temp.updateMatrix();
        trunk.setMatrixAt(treeIndex, temp.matrix);

        // Leaves (positioned relative to trunk height)
        temp.position.set(x + offsetX, y + (1.5 * sizeVariation), z + offsetZ);
        temp.updateMatrix();
        leaves.setMatrixAt(treeIndex, temp.matrix);

        // Enhanced color variation
        const hue = leafHSL.h + (Math.random() - 0.5) * 0.05;
        const saturation = Math.min(1, leafHSL.s + (Math.random() - 0.3) * 0.2);
        const lightness = Math.max(0.15, Math.min(0.35, leafHSL.l + (Math.random() - 0.5) * 0.15));
        color.setHSL(hue, saturation, lightness);
        leaves.setColorAt(treeIndex, color);

        treeIndex++;
      }
    });

    // Update buffers
    trunk.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  }, [tiles, hexSize]);

  return (
    <>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, undefined, totalTrees]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={TRUNK_COLOR} />
      </instancedMesh>
      <instancedMesh
        ref={leavesRef}
        args={[leavesGeometry, undefined, totalTrees]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial />
      </instancedMesh>
    </>
  );
}
