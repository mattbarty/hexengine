import { useMemo, useState, useEffect } from 'react';
import { HexGridConfig, HexTile as HexTileType } from '../../types';
import { getHexesInRadius } from '../../utils/hexUtils';
import { generateTerrain } from '../../utils/terrainGenerator';
import HexTile from './HexTile';

interface HexGridProps {
  config: HexGridConfig;
  seed: number;
  onTileSelect?: (tileId: string) => void;
  onGridCreated?: (tiles: HexTileType[]) => void;
}

export default function HexGrid({ config, seed, onTileSelect, onGridCreated }: HexGridProps) {
  // State to track the selected tile
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Generate hex grid and terrain
  const tiles = useMemo(() => {
    const hexes = getHexesInRadius(config.radius);
    return generateTerrain(hexes, config, seed);
  }, [config, seed]);

  // Notify parent when tiles are generated
  useEffect(() => {
    if (onGridCreated) {
      onGridCreated(tiles);
    }
  }, [tiles, onGridCreated]);

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