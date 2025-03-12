'use client';

import { useState, useCallback, useEffect } from 'react';
import HexWorld from './components/hexworld/HexWorld';
import InfoSidebar from './components/hexworld/InfoSidebar';
import { WorldConfig } from './types';
import { Orbit, RefreshCw, Settings } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);

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

  const handleConfigChange = useCallback((newConfig: WorldConfig) => {
    setWorldConfig(newConfig);
  }, []);

  const handleGenerateWorld = useCallback(() => {
    setIsGenerating(true);
    setIsRendering(true);

    // Set a timeout to reset the generating state if it takes too long
    const timeoutId = setTimeout(() => {
      setIsGenerating(false);
      setIsRendering(false);
    }, 6000); // 6 second timeout

    try {
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
    } finally {
      // Clear the timeout and reset generating state
      clearTimeout(timeoutId);
      setIsGenerating(false);
      // Note: We don't reset isRendering here as the 3D world is still rendering
    }
  }, [worldConfig]);

  const handleRenderComplete = useCallback(() => {
    setIsRendering(false);
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
            onRenderComplete={handleRenderComplete}
            isOrbiting={isOrbiting}
          />

          {/* Credit footer */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity text-gray-800 font-semibold">
            Cobbled together by <a href="https://www.mattbarty.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-teal-600 font-bold">Matt Barty</a>
          </div>

          {/* Control buttons - desktop only */}
          <div className="hidden sm:flex fixed top-4 right-4 z-50 gap-2">
            {!isSidebarOpen && (
              <>
                <button
                  onClick={() => setIsOrbiting(!isOrbiting)}
                  className={`
                    bg-gray-800 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2
                    ${isOrbiting ? 'bg-teal-700 hover:bg-teal-600' : 'hover:bg-gray-700'}
                  `}
                >
                  <Orbit
                    className={`h-5 w-5 ${isOrbiting ? 'animate-spin-reverse' : ''}`}
                  />
                  {isOrbiting ? 'Stop Orbit' : 'Orbit View'}
                </button>
                <button
                  onClick={handleGenerateWorld}
                  disabled={isGenerating || isRendering}
                  className={`
                    bg-gray-800 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2
                    ${(isGenerating || isRendering)
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:bg-gray-700'
                    }
                  `}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${(isGenerating || isRendering) ? 'animate-spin' : ''}`}
                  />
                  {isRendering ? 'Rendering...' : isGenerating ? 'Generating...' : 'Generate New World'}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="h-5 w-5" />
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
                onClick={() => setIsOrbiting(!isOrbiting)}
                className={`
                  bg-gray-800 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2
                  ${isOrbiting ? 'bg-teal-700 hover:bg-teal-600' : 'hover:bg-gray-700'}
                `}
              >
                <Orbit
                  className={`h-5 w-5 ${isOrbiting ? 'animate-spin-reverse' : ''}`}
                />
                {isOrbiting ? 'Stop' : 'Orbit'}
              </button>
              <button
                onClick={handleGenerateWorld}
                disabled={isGenerating || isRendering}
                className={`
                  bg-gray-800 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2
                  ${(isGenerating || isRendering)
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:bg-gray-700'
                  }
                `}
              >
                <RefreshCw
                  className={`h-5 w-5 ${(isGenerating || isRendering) ? 'animate-spin' : ''}`}
                />
                {isRendering ? 'Rendering...' : isGenerating ? 'Generating...' : 'Generate New World'}
              </button>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Settings className="h-5 w-5" />
                <p className='hidden sm:block'>
                  Settings
                </p>
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
            isGenerating={isGenerating}
            isRendering={isRendering}
            onRefresh={handleGenerateWorld}
            isOrbiting={isOrbiting}
            onOrbitToggle={() => setIsOrbiting(!isOrbiting)}
          />
        )}
      </div>
    </div>
  );
}
