import { useState, useEffect } from 'react';
import { HexTile, TerrainType, WorldConfig, TerrainColors, TerrainThresholds } from '../../types';

interface InfoSidebarProps {
  selectedTile: HexTile | null;
  worldConfig: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRefresh: () => void;
}

export default function InfoSidebar({
  selectedTile,
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

  // If a tile is selected, show its information
  if (selectedTile) {
    // Format values for display
    const elevation = selectedTile.elevation.toFixed(2);
    const humidity = (selectedTile.humidity * 100).toFixed(0) + '%';
    const temperature = ((selectedTile.temperature * 30) - 5).toFixed(1) + '°C';

    // Get terrain description
    const getTerrainDescription = (type: TerrainType): string => {
      switch (type) {
        case TerrainType.WATER:
          return 'Deep blue waters teeming with aquatic life.';
        case TerrainType.SHORE:
          return 'Shallow waters near the coastline.';
        case TerrainType.BEACH:
          return 'Sandy shores where land meets water.';
        case TerrainType.SHRUB:
          return 'Low vegetation and scattered bushes.';
        case TerrainType.FOREST:
          return 'Dense woodlands filled with trees and wildlife.';
        case TerrainType.STONE:
          return 'Rocky terrain with sparse vegetation.';
        case TerrainType.SNOW:
          return 'Snow-covered peaks at high elevations.';
        default:
          return 'Unknown terrain.';
      }
    };

    // Get terrain affordances (what can be done on this terrain)
    const getTerrainAffordances = (type: TerrainType): string[] => {
      switch (type) {
        case TerrainType.WATER:
          return ['Fishing', 'Naval travel', 'Trade routes'];
        case TerrainType.SHORE:
          return ['Shallow fishing', 'Wading', 'Boat launching'];
        case TerrainType.BEACH:
          return ['Gathering resources', 'Building docks', 'Relaxation'];
        case TerrainType.SHRUB:
          return ['Foraging', 'Hunting small game', 'Building outposts'];
        case TerrainType.FOREST:
          return ['Logging', 'Hunting', 'Herbalism'];
        case TerrainType.STONE:
          return ['Mining', 'Defensive positions', 'Observatories'];
        case TerrainType.SNOW:
          return ['Ice harvesting', 'Mountaineering', 'Winter sports'];
        default:
          return [];
      }
    };

    return (
      <div className="w-80 p-4 bg-gray-800 text-white h-full overflow-auto">
        <h2 className="text-xl font-bold mb-4">Tile Information</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Coordinates</h3>
          <p>Q: {selectedTile.coord.q}</p>
          <p>R: {selectedTile.coord.r}</p>
          <p>S: {selectedTile.coord.s}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Terrain</h3>
          <div className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded-sm"
              style={{ backgroundColor: TerrainColors[selectedTile.terrainType] }}
            ></div>
            <p className="capitalize">{selectedTile.terrainType}</p>
          </div>
          <p className="text-sm mt-2">{getTerrainDescription(selectedTile.terrainType)}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Properties</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-300">Elevation:</div>
            <div>{elevation}m</div>

            <div className="text-gray-300">Humidity:</div>
            <div>{humidity}</div>

            <div className="text-gray-300">Temperature:</div>
            <div>{temperature}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Possible Actions</h3>
          <ul className="list-disc list-inside">
            {getTerrainAffordances(selectedTile.terrainType).map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // If no tile is selected, show the configuration panel
  return (
    <div className="w-80 p-4 bg-gray-800 text-white h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">World Settings</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Terrain Generation</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Grid Radius: {localConfig.grid.radius}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={localConfig.grid.radius}
            onChange={(e) => handleConfigChange('grid', 'radius', e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Height: {localConfig.grid.gridHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={localConfig.grid.gridHeight}
            onChange={(e) => handleConfigChange('grid', 'gridHeight', e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>Flat</span>
            <span>Tall</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Scale: {localConfig.grid.noiseScale.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            value={localConfig.grid.noiseScale}
            onChange={(e) => handleConfigChange('grid', 'noiseScale', e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Detail: {localConfig.grid.noiseDetail.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={localConfig.grid.noiseDetail}
            onChange={(e) => handleConfigChange('grid', 'noiseDetail', e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>Smooth</span>
            <span>Detailed</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Fuzziness: {localConfig.grid.noiseFuzziness.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localConfig.grid.noiseFuzziness}
            onChange={(e) => handleConfigChange('grid', 'noiseFuzziness', e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>Clean</span>
            <span>Fuzzy</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Terrain Colors</h3>

        {Object.entries(TerrainThresholds).map(([terrain, threshold], index) => {
          // Skip the last one (SNOW) as it's always 1.0
          if (terrain === TerrainType.SNOW) return null;

          return (
            <div key={terrain} className="mb-2">
              <div className="flex items-center mb-1">
                <div
                  className="w-4 h-4 mr-2 rounded-sm"
                  style={{ backgroundColor: TerrainColors[terrain as TerrainType] }}
                ></div>
                <label className="block text-sm font-medium flex-grow capitalize">
                  {terrain.toLowerCase()}: {threshold.toFixed(2)}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Seed</h3>
        <div className="flex items-center">
          <span className="mr-2">Current: {localConfig.seed.toFixed(4)}</span>
          <button
            onClick={handleNewSeed}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            New Seed
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={onRefresh}
          className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
        >
          Regenerate World
        </button>
      </div>
    </div>
  );
} 