import { useRef } from 'react';
import { HexTile as HexTileType, TerrainType, TerrainColors } from '../../types';
import { Mesh } from 'three';
import { getTerrainColor } from '../../utils/terrainGenerator';

interface HexTileProps {
  tile: HexTileType;
  hexSize: number;
}

export default function HexTile({ tile, hexSize }: HexTileProps) {
  const meshRef = useRef<Mesh>(null);

  // Get color based on terrain type and water depth
  const getColor = () => {
    return getTerrainColor(tile.terrainType, tile.waterDepth);
  };

  // Calculate hex position from cube coordinates
  const x = hexSize * (3 / 2 * tile.coord.q);
  const z = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);

  return (
    <mesh
      ref={meshRef}
      position={[x, tile.elevation / 2, z]}
      rotation={[0, Math.PI / 6, 0]} // Rotate to align with hex grid
      receiveShadow
      castShadow
    >
      <cylinderGeometry args={[hexSize, hexSize, tile.elevation, 6, 1, false]} />
      <meshStandardMaterial
        color={getColor()}
        wireframe={false}
      />
    </mesh>
  );
} 