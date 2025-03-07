import { useState, useEffect } from 'react';
import { WorldConfig } from '../../types';

interface InfoSidebarProps {
  worldConfig: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRefresh: () => void;
}

export default function InfoSidebar({
  worldConfig,
  onConfigChange
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

  return (
    <div className="w-80 h-full bg-gray-800/95 backdrop-blur-sm text-white overflow-y-auto shadow-xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">World Settings</h2>

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