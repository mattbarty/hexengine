import { useRef } from 'react';
import { HexTile as HexTileType, TerrainType, TerrainColors } from '../../types';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { getTerrainColor } from '../../utils/terrainGenerator';

interface HexTileProps {
  tile: HexTileType;
  hexSize: number;
  onClick: (tileId: string) => void;
}

export default function HexTile({ tile, hexSize, onClick }: HexTileProps) {
  const meshRef = useRef<Mesh>(null);

  // Animate selection
  useFrame(() => {
    if (!meshRef.current) return;

    if (tile.isSelected) {
      // Pulse effect for selected tile
      const time = Date.now() * 0.001;
      meshRef.current.position.y = tile.elevation / 2 + Math.sin(time * 2) * 0.05;
    } else {
      // Reset position if not selected
      meshRef.current.position.y = tile.elevation / 2;
    }
  });

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
      onClick={(e) => {
        e.stopPropagation();
        onClick(tile.id);
      }}
      receiveShadow
      castShadow
    >
      <cylinderGeometry args={[hexSize, hexSize, tile.elevation, 6, 1, false]} />
      <meshStandardMaterial
        color={getColor()}
        wireframe={false}
        emissive={tile.isSelected ? "#ffffff" : "#000000"}
        emissiveIntensity={tile.isSelected ? 0.2 : 0}
        transparent={tile.terrainType === TerrainType.WATER}
        opacity={tile.terrainType === TerrainType.WATER ? 0.8 : 1}
      />
    </mesh>
  );
} 