import { useState, useEffect } from 'react';
import { TerrainType, WorldConfig, TerrainColors, TerrainThresholds } from '../../types';

interface InfoSidebarProps {
  worldConfig: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRefresh: () => void;
}

export default function InfoSidebar({
  worldConfig,
  onConfigChange,
  onRefresh
}: InfoSidebarProps) {
  // Local state for config values (to avoid too many re-renders)
  const [localConfig, setLocalConfig] = useState(worldConfig);

  // Update local config when worldConfig changes
  useEffect(() => {
    setLocalConfig(worldConfig);
  }, [worldConfig]);

  // Handle slider changes
  const handleConfigChange = (
    section: 'grid' | 'camera',
    key: string,
    value: number | string
  ) => {
    const newConfig = {
      ...localConfig,
      [section]: {
        ...localConfig[section],
        [key]: typeof value === 'string' ? parseFloat(value) : value
      }
    };

    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Generate a new random seed
  const handleNewSeed = () => {
    const newConfig = {
      ...localConfig,
      seed: Math.random()
    };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    onRefresh();
  };

  const handleGridChange = (key: string, value: number) => {
    onConfigChange({
      ...worldConfig,
      grid: {
        ...worldConfig.grid,
        [key]: value,
      },
    });
  };

  const handleTerrainBandChange = (key: keyof typeof worldConfig.grid.terrainBands, value: number) => {
    onConfigChange({
      ...worldConfig,
      grid: {
        ...worldConfig.grid,
        terrainBands: {
          ...worldConfig.grid.terrainBands,
          [key]: value,
        },
      },
    });
  };

  // If no tile is selected, show the configuration panel
  return (
    <div className="w-80 h-full bg-gray-800/95 backdrop-blur-sm text-white overflow-y-auto shadow-xl">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">World Settings</h2>

        <div className="space-y-6">
          {/* Grid Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Grid Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">
                  Grid Radius: {worldConfig.grid.radius}
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={worldConfig.grid.radius}
                  onChange={(e) => handleGridChange('radius', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Grid Height: {worldConfig.grid.gridHeight}
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.5"
                  value={worldConfig.grid.gridHeight}
                  onChange={(e) => handleGridChange('gridHeight', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Water Level: {(worldConfig.grid.waterLevel * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.waterLevel}
                  onChange={(e) => handleGridChange('waterLevel', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Noise Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Noise Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">
                  Noise Scale: {worldConfig.grid.noiseScale.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={worldConfig.grid.noiseScale}
                  onChange={(e) => handleGridChange('noiseScale', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Detail: {(worldConfig.grid.noiseDetail * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.noiseDetail}
                  onChange={(e) => handleGridChange('noiseDetail', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Fuzziness: {(worldConfig.grid.noiseFuzziness * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.noiseFuzziness}
                  onChange={(e) => handleGridChange('noiseFuzziness', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Terrain Bands */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Terrain Bands</h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">
                  Shore: {(worldConfig.grid.terrainBands.shore * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.shore}
                  onChange={(e) => handleTerrainBandChange('shore', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Beach: {(worldConfig.grid.terrainBands.beach * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.3"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.beach}
                  onChange={(e) => handleTerrainBandChange('beach', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Shrub: {(worldConfig.grid.terrainBands.shrub * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="0.4"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.shrub}
                  onChange={(e) => handleTerrainBandChange('shrub', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Forest: {(worldConfig.grid.terrainBands.forest * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="0.7"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.forest}
                  onChange={(e) => handleTerrainBandChange('forest', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Stone: {(worldConfig.grid.terrainBands.stone * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="0.9"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.stone}
                  onChange={(e) => handleTerrainBandChange('stone', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Snow: {(worldConfig.grid.terrainBands.snow * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1"
                  step="0.01"
                  value={worldConfig.grid.terrainBands.snow}
                  onChange={(e) => handleTerrainBandChange('snow', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Stone Distribution */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Stone Distribution</h3>
            <div className="text-sm opacity-80">
              <p className="mb-2">Spawn Rates:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Shore: 5%</li>
                <li>Beach: 8%</li>
                <li>Shrub: 12%</li>
                <li>Forest: 15%</li>
                <li>Stone: 40%</li>
                <li>Snow: 20%</li>
              </ul>
            </div>
          </div>

          {/* Regenerate Button */}
          <div>
            <button
              onClick={onRefresh}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Regenerate World
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 