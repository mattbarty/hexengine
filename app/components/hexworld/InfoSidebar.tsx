import { WorldConfig } from '../../types';
import { RefreshCw, Orbit, X } from 'lucide-react';

interface InfoSidebarProps {
  worldConfig: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRefresh?: () => void;
  onClose: () => void;
  isGenerating?: boolean;
  isRendering?: boolean;
  isOrbiting?: boolean;
  onOrbitToggle?: () => void;
}

export default function InfoSidebar({
  worldConfig,
  onConfigChange,
  onRefresh,
  onClose,
  isGenerating = false,
  isRendering = false,
  isOrbiting = false,
  onOrbitToggle
}: InfoSidebarProps) {
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
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="h-full bg-gray-800/95 backdrop-blur-sm text-white overflow-y-auto shadow-xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">World Settings</h2>
          <div className="flex gap-2">
            <button
              onClick={handleWorldRefresh}
              disabled={isGenerating || isRendering}
              className={`
                flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2
                ${(isGenerating || isRendering)
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:bg-gray-600/50'
                }
              `}
              aria-label="Generate new world"
              title="Generate new world"
            >
              <RefreshCw
                className={`h-5 w-5 ${(isGenerating || isRendering) ? 'animate-spin' : ''}`}
              />
              {isRendering ? 'Rendering...' : isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={onOrbitToggle}
              className={`
                bg-gray-700/50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2
                ${isOrbiting ? 'bg-teal-700/50 hover:bg-teal-600/50' : 'hover:bg-gray-600/50'}
              `}
              aria-label="Toggle orbit view"
              title="Toggle orbit view"
            >
              <Orbit
                className={`h-5 w-5 ${isOrbiting ? 'animate-spin-reverse' : ''}`}
              />
              {isOrbiting ? 'Stop' : 'Orbit'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="h-6 w-6 text-gray-400 hover:text-white" />
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