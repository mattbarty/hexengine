import { useState, useEffect } from 'react';
import { WorldConfig } from '../../types';

interface InfoSidebarProps {
  worldConfig: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export default function InfoSidebar({
  worldConfig,
  onConfigChange,
  onRefresh,
  onClose
}: InfoSidebarProps) {
  // Local state for config values
  const [localConfig, setLocalConfig] = useState(worldConfig);

  // Update local config when worldConfig changes
  useEffect(() => {
    setLocalConfig(worldConfig);
  }, [worldConfig]);

  // Handle grid changes
  const handleGridChange = (key: string, value: number) => {
    onConfigChange({
      ...worldConfig,
      grid: {
        ...worldConfig.grid,
        [key]: value,
      },
    });
  };

  // Handle refresh with new seed
  const handleWorldRefresh = () => {
    // Generate new terrain bands with randomization
    const waterLevel = Math.random() * 0.35; // 0.15-0.5 for more variety in water levels
    const shore = Math.random() * 0.05 + 0.08; // 0.08-0.13
    const beach = shore + Math.random() * 0.08 + 0.07; // shore + 0.07-0.15
    const shrub = beach + Math.random() * 0.08 + 0.07; // beach + 0.07-0.15
    const forest = shrub + Math.random() * 0.15 + 0.15; // shrub + 0.15-0.30
    const stone = forest + Math.random() * 0.15 + 0.15; // forest + 0.15-0.30
    const snow = Math.min(stone + Math.random() * 0.1 + 0.05, 0.95); // stone + 0.05-0.15, capped at 0.95

    // Generate new terrain detail parameters
    const noiseScale = Math.random() * 1.5 + 0.8; // 0.8-2.3 for varied feature sizes
    const noiseDetail = Math.random() * 0.5 + 0.2; // 0.2-0.7 for varied detail levels
    const noiseFuzziness = Math.random() * 0.6 + 0.2; // 0.2-0.8 for varied surface roughness

    onConfigChange({
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
    onRefresh();
  };

  return (
    <div className="h-full bg-gray-800/95 backdrop-blur-sm text-white overflow-y-auto shadow-xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">World Settings</h2>
          <button
            onClick={handleWorldRefresh}
            className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg hover:bg-gray-600/50 transition-colors flex items-center justify-center gap-2"
            aria-label="Generate new world"
            title="Generate new world"
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
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400 hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* World Scale */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">World Scale</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Grid Radius
                  </label>
                  <span className="text-sm text-blue-300">{worldConfig.grid.radius}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={worldConfig.grid.radius}
                  onChange={(e) => handleGridChange('radius', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Small</span>
                  <span className="text-xs text-gray-400">Large</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Terrain Height
                  </label>
                  <span className="text-sm text-blue-300">{worldConfig.grid.gridHeight}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.5"
                  value={worldConfig.grid.gridHeight}
                  onChange={(e) => handleGridChange('gridHeight', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Flat</span>
                  <span className="text-xs text-gray-400">Mountainous</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terrain Features */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Terrain Features</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Water Level
                  </label>
                  <span className="text-sm text-blue-300">{(worldConfig.grid.waterLevel * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.waterLevel}
                  onChange={(e) => handleGridChange('waterLevel', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Arid</span>
                  <span className="text-xs text-gray-400">Oceanic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terrain Detail */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Terrain Detail</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Feature Scale
                  </label>
                  <span className="text-sm text-blue-300">{worldConfig.grid.noiseScale.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={worldConfig.grid.noiseScale}
                  onChange={(e) => handleGridChange('noiseScale', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Small</span>
                  <span className="text-xs text-gray-400">Large</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Detail Level
                  </label>
                  <span className="text-sm text-blue-300">{(worldConfig.grid.noiseDetail * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.noiseDetail}
                  onChange={(e) => handleGridChange('noiseDetail', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Smooth</span>
                  <span className="text-xs text-gray-400">Detailed</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Surface Roughness
                  </label>
                  <span className="text-sm text-blue-300">{(worldConfig.grid.noiseFuzziness * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.noiseFuzziness}
                  onChange={(e) => handleGridChange('noiseFuzziness', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Smooth</span>
                  <span className="text-xs text-gray-400">Rough</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 