'use client';

import { useState, useCallback, useEffect } from 'react';
import HexWorld from './components/hexworld/HexWorld';
import InfoSidebar from './components/hexworld/InfoSidebar';
import { HexTile, WorldConfig } from './types';

// Default world configuration without the random seed
const defaultWorldConfigBase: Omit<WorldConfig, 'seed'> = {
  grid: {
    radius: 30,
    hexSize: 1,
    gridHeight: 14,
    noiseScale: 1.35,
    noiseDetail: 0.35,
    noiseFuzziness: 0.4,
    waterLevel: 0.2,
    terrainBands: {
      shore: 0.1,
      beach: 0.2,
      shrub: 0.3,
      forest: 0.55,
      stone: 0.8,
      snow: 0.85
    }
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      <div className="absolute inset-0">
        <HexWorld
          key={worldKey}
          config={worldConfig}
        />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
      >
        {isSidebarOpen ? 'Close Settings' : 'Open Settings'}
      </button>

      {/* InfoSidebar with transition */}
      <div className={`absolute top-0 right-0 h-full transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <InfoSidebar
          worldConfig={worldConfig}
          onConfigChange={handleConfigChange}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
