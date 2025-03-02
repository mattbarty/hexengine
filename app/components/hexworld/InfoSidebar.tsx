import { HexTile, TerrainType } from '../../types';

interface InfoSidebarProps {
  selectedTile: HexTile | null;
}

export default function InfoSidebar({ selectedTile }: InfoSidebarProps) {
  if (!selectedTile) {
    return (
      <div className="w-64 p-4 bg-gray-800 text-white h-full">
        <h2 className="text-xl font-bold mb-4">HexWorld Info</h2>
        <p>Click on any tile to view its information.</p>
      </div>
    );
  }

  // Format values for display
  const elevation = selectedTile.elevation.toFixed(2);
  const humidity = (selectedTile.humidity * 100).toFixed(0) + '%';
  const temperature = ((selectedTile.temperature * 30) - 5).toFixed(1) + '°C';

  // Get terrain description
  const getTerrainDescription = (type: TerrainType): string => {
    switch (type) {
      case TerrainType.WATER:
        return 'Deep blue waters teeming with aquatic life.';
      case TerrainType.LAND:
        return 'Grassy plains suitable for farming and settlements.';
      case TerrainType.FOREST:
        return 'Dense woodlands filled with valuable timber and wildlife.';
      case TerrainType.MOUNTAIN:
        return 'Rugged peaks rich with minerals and rare resources.';
      case TerrainType.SAND:
        return 'Dry sandy shores with sparse vegetation.';
      default:
        return 'Unknown terrain.';
    }
  };

  // Get terrain affordances (what can be done on this terrain)
  const getTerrainAffordances = (type: TerrainType): string[] => {
    switch (type) {
      case TerrainType.WATER:
        return ['Fishing', 'Naval travel', 'Trade routes'];
      case TerrainType.LAND:
        return ['Farming', 'Building settlements', 'Roads'];
      case TerrainType.FOREST:
        return ['Logging', 'Hunting', 'Herbalism'];
      case TerrainType.MOUNTAIN:
        return ['Mining', 'Defensive positions', 'Observatories'];
      case TerrainType.SAND:
        return ['Beach resorts', 'Glass making', 'Harbors'];
      default:
        return [];
    }
  };

  return (
    <div className="w-64 p-4 bg-gray-800 text-white h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">Tile Information</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Coordinates</h3>
        <p>Q: {selectedTile.coord.q}</p>
        <p>R: {selectedTile.coord.r}</p>
        <p>S: {selectedTile.coord.s}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Terrain</h3>
        <p className="capitalize">{selectedTile.terrainType}</p>
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