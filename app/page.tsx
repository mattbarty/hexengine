'use client';

import { useState, useCallback, useEffect } from 'react';
import HexWorld from './components/hexworld/HexWorld';
import InfoSidebar from './components/hexworld/InfoSidebar';
import { HexTile, WorldConfig } from './types';

// Default world configuration without the random seed
const defaultWorldConfigBase: Omit<WorldConfig, 'seed'> = {
  grid: {
    radius: 25,
    hexSize: 1,
    gridHeight: 14,
    noiseScale: 1.45,
    noiseDetail: 0.75,
    noiseFuzziness: 1,
    waterLevel: 0.2
  },
  camera: {
    position: [0, 40, 50],
    rotation: [-Math.PI / 3, 0, 0],
    fov: 45
  }
};

export default function Home() {
  // State to control client-side rendering
  const [isClient, setIsClient] = useState(false);
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);

  // Initialize worldConfig with a fixed seed for initial render
  const [worldConfig, setWorldConfig] = useState<WorldConfig>({
    ...defaultWorldConfigBase,
    seed: 12345 // Fixed initial seed
  });

  // Use a key to force re-render of the HexWorld component when needed
  const [worldKey, setWorldKey] = useState<number>(0);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);

    // Generate a random seed only on the client side
    setWorldConfig(prev => ({
      ...prev,
      seed: Math.random()
    }));
  }, []);

  const handleTileSelect = (tile: HexTile | null) => {
    setSelectedTile(tile);
  };

  const handleConfigChange = useCallback((newConfig: WorldConfig) => {
    setWorldConfig(newConfig);
  }, []);

  const handleRefresh = useCallback(() => {
    // Increment the key to force a complete re-render of the HexWorld
    setWorldKey(prev => prev + 1);
    // Clear selected tile when regenerating
    setSelectedTile(null);
  }, []);

  // Only render the full UI on the client side
  if (!isClient) {
    return <div className="flex h-screen w-full bg-gray-900">
      <div className="m-auto text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="flex h-screen w-full bg-gray-900">
      <div className="flex-grow relative">
        <div className="absolute inset-0">
          <HexWorld
            key={worldKey}
            config={worldConfig}
          />
        </div>
      </div>
      <InfoSidebar
        worldConfig={worldConfig}
        onConfigChange={handleConfigChange}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
