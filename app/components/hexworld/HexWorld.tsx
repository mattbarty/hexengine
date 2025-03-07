import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  Stats,
  Environment,
  PerspectiveCamera
} from '@react-three/drei';
import { WorldConfig, HexTile } from '../../types';
import HexGrid from './HexGrid';
import { useState, useCallback, useMemo } from 'react';

interface HexWorldProps {
  config: WorldConfig;
}

export default function HexWorld({ config }: HexWorldProps) {
  // Map of tile ids to tile data for quick lookup
  const [tileMap, setTileMap] = useState<Record<string, HexTile>>({});

  // Set the tile map after terrain generation
  const handleGridCreated = useCallback((tiles: HexTile[]) => {
    const map: Record<string, HexTile> = {};
    tiles.forEach(tile => {
      map[tile.id] = tile;
    });
    setTileMap(map);
  }, []);

  // Calculate camera distance limits based on grid size
  const cameraLimits = useMemo(() => {
    const baseDistance = 90;
    const gridFactor = Math.max(1, config.grid.radius / 30); // Scale based on default radius of 30
    return {
      minDistance: baseDistance,
      maxDistance: baseDistance * (gridFactor * 1.5) // Increase max distance more aggressively
    };
  }, [config.grid.radius]);

  const { camera } = config;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        resize={{ scroll: false }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Performance monitoring in development */}
        {process.env.NODE_ENV === 'development' && <Stats />}

        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={camera.position}
          rotation={camera.rotation}
          fov={camera.fov}
        />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.5}
          minDistance={cameraLimits.minDistance}
          maxDistance={cameraLimits.maxDistance}
          maxPolarAngle={Math.PI / 2.1} // Prevent going below the horizon
          target={[0, 0, 0]} // Center of the grid
        />

        {/* Lighting */}
        <directionalLight
          position={[10, 20, 5]}
          intensity={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <ambientLight intensity={0.4} />

        {/* Environment */}
        <Sky
          distance={450000}
          sunPosition={[1, 0.6, 0.5]}
          inclination={0.2}
          azimuth={0.25}
        />
        <Environment preset="sunset" />

        {/* Hex Grid */}
        <HexGrid
          config={config.grid}
          seed={config.seed}
          onGridCreated={handleGridCreated}
        />
      </Canvas>
    </div>
  );
} 