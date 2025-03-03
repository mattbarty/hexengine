import { useMemo, useEffect } from 'react';
import { HexGridConfig, HexTile as HexTileType } from '../../types';
import { getHexesInRadius } from '../../utils/hexUtils';
import { generateTerrain } from '../../utils/terrainGenerator';
import HexTile from './HexTile';
import Tree from './Tree';
import Grass from './Grass';

interface HexGridProps {
  config: HexGridConfig;
  seed: number;
  onGridCreated?: (tiles: HexTileType[]) => void;
}

export default function HexGrid({ config, seed, onGridCreated }: HexGridProps) {
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

  return (
    <group>
      {tiles.map((tile) => (
        <HexTile
          key={tile.id}
          tile={tile}
          hexSize={config.hexSize}
        />
      ))}
      <Tree tiles={tiles} hexSize={config.hexSize} />
      <Grass tiles={tiles} hexSize={config.hexSize} />
    </group>
  );
} 