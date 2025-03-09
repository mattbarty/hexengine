import { useRef, useEffect } from 'react';
import { HexTile as HexTileType, TerrainType, TerrainColors } from '../../types';
import { Mesh, Vector3 } from 'three';
import { getTerrainColor } from '../../utils/terrainGenerator';
import { useFrame } from '@react-three/fiber';

interface HexTileProps {
  tile: HexTileType;
  hexSize: number;
  animationDuration?: number;
}

export default function HexTile({ tile, hexSize, animationDuration = 1.5 }: HexTileProps) {
  const meshRef = useRef<Mesh>(null);
  const targetPosition = useRef(new Vector3());
  const initialPosition = useRef(new Vector3());
  const animationProgress = useRef(1);

  // Get color based on terrain type and water depth
  const getColor = () => {
    return getTerrainColor(tile.terrainType, tile.waterDepth);
  };

  // Calculate hex position from cube coordinates
  const x = hexSize * (3 / 2 * tile.coord.q);
  const z = hexSize * (Math.sqrt(3) / 2 * tile.coord.q + Math.sqrt(3) * tile.coord.r);

  // Update target position when tile changes
  useEffect(() => {
    if (meshRef.current) {
      // Store the current position as initial position
      initialPosition.current.copy(meshRef.current.position);
      // Set new target position
      targetPosition.current.set(x, tile.elevation / 2, z);
      // Reset animation progress
      animationProgress.current = 0;
    }
  }, [tile, x, z]);

  // Animate position changes
  useFrame((_, delta) => {
    if (meshRef.current && animationProgress.current < 1) {
      // Update animation progress
      animationProgress.current = Math.min(1, animationProgress.current + delta / animationDuration);

      // Use easeInOutCubic easing function
      const t = animationProgress.current;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Interpolate position
      meshRef.current.position.lerpVectors(
        initialPosition.current,
        targetPosition.current,
        ease
      );
    }
  });

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