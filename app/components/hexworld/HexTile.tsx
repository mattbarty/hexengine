import { useRef, useMemo } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { HexTile as HexTileType, TerrainType } from '../../types';
import { getTerrainColor } from '../../utils/terrainGenerator';

interface HexTileProps {
  tile: HexTileType;
  hexSize: number;
  onClick?: (tileId: string) => void;
}

export default function HexTile({ tile, hexSize, onClick }: HexTileProps) {
  const meshRef = useRef<Mesh>(null);

  // Normalized elevation for color calculation (0-1 range)
  const normalizedElevation = tile.elevation / 10; // Assuming max height is 10

  // Calculate color based on terrain type and elevation
  const color = useMemo(() => {
    return getTerrainColor(tile.terrainType, tile.elevation, normalizedElevation);
  }, [tile.terrainType, tile.elevation, normalizedElevation]);

  // Optional animation for selected state
  useFrame(() => {
    if (!meshRef.current) return;

    if (tile.isSelected) {
      // Animate selected tile (e.g., slight hover effect)
      const targetY = tile.elevation / 2 + 0.2;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
    } else {
      // Return to normal position
      const targetY = tile.elevation / 2;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
    }
  });

  // Handle click events
  const handleClick = () => {
    if (onClick) {
      onClick(tile.id);
    }
  };

  // Calculate hex position from cube coordinates
  const x = hexSize * (3 / 2 * tile.coord.q);
  const z = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);

  // Calculate the height of the hex tile
  // Minimum base height (even for water) plus elevation
  const baseHeight = 0.2; // Minimum base height for all tiles
  const tileHeight = Math.max(baseHeight, tile.elevation);

  // Position y is half the height (since cylinder is centered vertically)
  const y = tileHeight / 2;

  // Material properties based on terrain type
  const materialProps = tile.terrainType === TerrainType.WATER
    ? { roughness: 0.1, envMapIntensity: 0.5, metalness: 0.2 }
    : { roughness: 0.8, metalness: 0.1 };

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      rotation={[0, Math.PI / 6, 0]}
      onClick={handleClick}
      receiveShadow
      castShadow
    >
      <cylinderGeometry
        args={[
          hexSize, // top radius
          hexSize, // bottom radius
          tileHeight, // Use the calculated height
          6, // radial segments (6 for hexagon)
          1, // height segments
          false // open ended
        ]}
      />
      <meshStandardMaterial
        color={color}
        {...materialProps}
      />
    </mesh>
  );
} 