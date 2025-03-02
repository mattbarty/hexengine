import { useMemo, useState } from 'react';
import { HexGridConfig, HexTile as HexTileType } from '../../types';
import { getHexesInRadius } from '../../utils/hexUtils';
import { generateTerrain } from '../../utils/terrainGenerator';
import HexTile from './HexTile';

interface HexGridProps {
  config: HexGridConfig;
  onTileSelect?: (tileId: string) => void;
}

export default function HexGrid({ config, onTileSelect }: HexGridProps) {
  // State to track the selected tile
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Generate hex grid and terrain
  const tiles = useMemo(() => {
    const hexes = getHexesInRadius(config.radius);
    return generateTerrain(hexes, config);
  }, [config]);

  // Handle tile click
  const handleTileClick = (tileId: string) => {
    setSelectedTileId(tileId);
    if (onTileSelect) {
      onTileSelect(tileId);
    }
  };

  return (
    <group>
      {tiles.map((tile) => (
        <HexTile
          key={tile.id}
          tile={{
            ...tile,
            isSelected: tile.id === selectedTileId
          }}
          hexSize={config.hexSize}
          onClick={handleTileClick}
        />
      ))}
    </group>
  );
} 