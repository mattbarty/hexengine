'use client';

import { useState, useCallback, useEffect } from 'react';
import HexWorld from './components/hexworld/HexWorld';
import InfoSidebar from './components/hexworld/InfoSidebar';
import { HexTile, WorldConfig } from './types';

// Default world configuration without the random seed
const defaultWorldConfigBase: Omit<WorldConfig, 'seed'> = {
  grid: {
    radius: 24,
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
    position: [0, 60, 80],
    rotation: [-Math.PI / 3, 0, 0],
    fov: 60
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

  // Only render the full UI on the client side
  if (!isClient) {
    return <div className="flex h-screen w-full bg-gray-900">
      <div className="m-auto text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden flex-col sm:flex-row">
      {/* Main content area with buttons container */}
      <div className="flex flex-col sm:flex-1">
        <div className={`
          relative min-w-0 aspect-square sm:aspect-auto
          ${isSidebarOpen
            ? 'w-full h-[40vh] sm:h-full'
            : 'w-full h-full sm:w-full sm:mx-auto'
          }
        `}>
          <HexWorld
            config={worldConfig}
          />

          {/* Control buttons - desktop only */}
          <div className="hidden sm:flex fixed top-4 right-4 z-50 gap-2">
            {!isSidebarOpen && (
              <>
                <button
                  onClick={() => {
                    // Generate new terrain bands with randomization
                    const waterLevel = Math.random() * 0.35 + 0.15;
                    const shore = Math.random() * 0.05 + 0.08;
                    const beach = shore + Math.random() * 0.08 + 0.07;
                    const shrub = beach + Math.random() * 0.08 + 0.07;
                    const forest = shrub + Math.random() * 0.15 + 0.15;
                    const stone = forest + Math.random() * 0.15 + 0.15;
                    const snow = Math.min(stone + Math.random() * 0.1 + 0.05, 0.95);

                    // Generate new terrain detail parameters
                    const noiseScale = Math.random() * 1.5 + 0.8;
                    const noiseDetail = Math.random() * 0.5 + 0.2;
                    const noiseFuzziness = Math.random() * 0.6 + 0.2;

                    setWorldConfig({
                      ...worldConfig,
                      seed: Math.random(),
                      grid: {
                        ...worldConfig.grid,
                        waterLevel,
                        noiseScale,
                        noiseDetail,
                        noiseFuzziness,
                        terrainBands: {
                          shore,
                          beach,
                          shrub,
                          forest,
                          stone,
                          snow
                        }
                      }
                    });
                    setSelectedTile(null);
                  }}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Generate New World
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:block">Settings</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Control buttons - mobile only */}
        <div className="flex sm:hidden justify-center gap-2 py-4">
          {!isSidebarOpen && (
            <>
              <button
                onClick={() => {
                  // Generate new terrain bands with randomization
                  const waterLevel = Math.random() * 0.35 + 0.15;
                  const shore = Math.random() * 0.05 + 0.08;
                  const beach = shore + Math.random() * 0.08 + 0.07;
                  const shrub = beach + Math.random() * 0.08 + 0.07;
                  const forest = shrub + Math.random() * 0.15 + 0.15;
                  const stone = forest + Math.random() * 0.15 + 0.15;
                  const snow = Math.min(stone + Math.random() * 0.1 + 0.05, 0.95);

                  // Generate new terrain detail parameters
                  const noiseScale = Math.random() * 1.5 + 0.8;
                  const noiseDetail = Math.random() * 0.5 + 0.2;
                  const noiseFuzziness = Math.random() * 0.6 + 0.2;

                  setWorldConfig({
                    ...worldConfig,
                    seed: Math.random(),
                    grid: {
                      ...worldConfig.grid,
                      waterLevel,
                      noiseScale,
                      noiseDetail,
                      noiseFuzziness,
                      terrainBands: {
                        shore,
                        beach,
                        shrub,
                        forest,
                        stone,
                        snow
                      }
                    }
                  });
                  setSelectedTile(null);
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Generate New World
              </button>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sidebar with transition */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isSidebarOpen
            ? 'h-[60vh] w-full sm:h-full sm:w-80'
            : 'h-0 w-full sm:w-0'
          }
        `}
      >
        {isSidebarOpen && (
          <InfoSidebar
            worldConfig={worldConfig}
            onConfigChange={handleConfigChange}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
