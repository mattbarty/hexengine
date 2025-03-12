import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  Stats,
  Environment,
  PerspectiveCamera
} from '@react-three/drei';
import { WorldConfig } from '../../types';
import HexGrid from './HexGrid';
import { useCallback, useMemo, useRef } from 'react';

interface HexWorldProps {
  config: WorldConfig;
  onRenderComplete?: () => void;
  isOrbiting?: boolean;
}

function Controls({ isOrbiting, cameraLimits, camera }: {
  isOrbiting: boolean;
  cameraLimits: { minDistance: number; maxDistance: number; };
  camera: WorldConfig['camera'];
}) {
  const orbitControlsRef = useRef(null);

  useFrame(() => {
    const controls = orbitControlsRef.current as { autoRotate: boolean; autoRotateSpeed: number; } | null;
    if (controls && isOrbiting) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0;
    } else if (controls) {
      controls.autoRotate = false;
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={camera.position}
        rotation={camera.rotation}
        fov={camera.fov}
      />
      <OrbitControls
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        minDistance={cameraLimits.minDistance}
        maxDistance={cameraLimits.maxDistance}
        maxPolarAngle={Math.PI / 2.1} // Prevent going below the horizon
        target={[0, 0, 0]} // Center of the grid
      />
    </>
  );
}

export default function HexWorld({ config, onRenderComplete, isOrbiting = false }: HexWorldProps) {
  // Set the tile map after terrain generation
  const handleGridCreated = useCallback(() => {
    // Call onRenderComplete when the grid is created and rendered
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  // Calculate camera distance limits based on grid size
  const cameraLimits = useMemo(() => {
    const baseDistance = 90;
    const gridFactor = Math.max(1, config.grid.radius / 30); // Scale based on default radius of 30
    return {
      minDistance: baseDistance * 0.4, // Allow closer zoom
      maxDistance: baseDistance * (gridFactor * 1.1) // Allow much further zoom out
    };
  }, [config.grid.radius]);

  return (
    <div className="absolute inset-0 aspect-square sm:aspect-auto">
      <Canvas
        shadows
        resize={{ scroll: false }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Performance monitoring in development */}
        {process.env.NODE_ENV === 'development' && <Stats />}

        {/* Camera and Controls */}
        <Controls
          isOrbiting={isOrbiting}
          cameraLimits={cameraLimits}
          camera={config.camera}
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