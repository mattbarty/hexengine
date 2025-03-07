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
    // randomize water level
    waterLevel: Math.random() * 0.2 + 0.2,
    // Randomize terrain bands while maintaining proper ordering
    terrainBands: (() => {
      // Base values
      const shore = Math.random() * 0.05 + 0.08; // 0.08-0.13
      const beach = shore + Math.random() * 0.08 + 0.07; // shore + 0.07-0.15
      const shrub = beach + Math.random() * 0.08 + 0.07; // beach + 0.07-0.15
      const forest = shrub + Math.random() * 0.15 + 0.15; // shrub + 0.15-0.30
      const stone = forest + Math.random() * 0.15 + 0.15; // forest + 0.15-0.30
      const snow = stone + Math.random() * 0.1 + 0.05; // stone + 0.05-0.15

      return {
        shore,
        beach,
        shrub,
        forest,
        stone,
        snow: Math.min(snow, 0.95) // Ensure snow doesn't go too high
      };
    })()
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
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 relative min-w-0">
        <HexWorld
          key={worldKey}
          config={worldConfig}
        />

        {/* Settings Button - only shown when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Open Settings
          </button>
        )}
      </div>

      {/* Sidebar with transition */}
      <div
        className={`flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-80' : 'w-0'
          }`}
      >
        {isSidebarOpen && <InfoSidebar
          worldConfig={worldConfig}
          onConfigChange={handleConfigChange}
          onRefresh={handleRefresh}
          onClose={() => setIsSidebarOpen(false)}
        />}
      </div>
    </div>
  );
}
