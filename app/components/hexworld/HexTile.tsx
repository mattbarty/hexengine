import { useRef } from 'react';
import { HexTile as HexTileType, TerrainType, TerrainColors } from '../../types';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

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
      meshRef.current.position.y = tile.elevation + Math.sin(time * 2) * 0.05;
    } else {
      // Reset position if not selected
      meshRef.current.position.y = tile.elevation;
    }
  });

  // Get color based on terrain type
  const getColor = () => {
    return TerrainColors[tile.terrainType];
  };

  // Get height based on terrain type
  const getHeight = () => {
    switch (tile.terrainType) {
      case TerrainType.WATER:
        return 0.05;
      case TerrainType.SHORE:
        return 0.1;
      case TerrainType.BEACH:
        return 0.15;
      case TerrainType.SHRUB:
        return 0.2;
      case TerrainType.FOREST:
        return 0.3;
      case TerrainType.STONE:
        return 0.4;
      case TerrainType.SNOW:
        return 0.5;
      default:
        return 0.2;
    }
  };

  // Calculate hex position from cube coordinates
  const x = hexSize * (3 / 2 * tile.coord.q);
  const z = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);

  return (
    <mesh
      ref={meshRef}
      position={[x, tile.elevation, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(tile.id);
      }}
    >
      <cylinderGeometry args={[hexSize, hexSize, getHeight(), 6, 1, false]} />
      <meshStandardMaterial
        color={getColor()}
        wireframe={false}
        emissive={tile.isSelected ? "#ffffff" : "#000000"}
        emissiveIntensity={tile.isSelected ? 0.2 : 0}
      />
    </mesh>
  );
} 