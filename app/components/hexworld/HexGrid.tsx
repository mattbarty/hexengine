import { useMemo, useEffect, useState } from 'react';
import { HexGridConfig, HexTile as HexTileType } from '../../types';
import { getHexesInRadius } from '../../utils/hexUtils';
import { generateTerrain } from '../../utils/terrainGenerator';
import HexTile from './HexTile';
import Tree from './Tree';
import Grass from './Grass';
import Stone from './Stone';

interface HexGridProps {
  config: HexGridConfig;
  seed: number;
  onGridCreated?: (tiles: HexTileType[]) => void;
}

export default function HexGrid({ config, seed, onGridCreated }: HexGridProps) {
  // Keep track of current tiles for animation
  const [currentTiles, setCurrentTiles] = useState<HexTileType[]>([]);

  // Generate hex grid and terrain
  const newTiles = useMemo(() => {
    const hexes = getHexesInRadius(config.radius);
    return generateTerrain(hexes, config, seed);
  }, [config, seed]);

  // Update current tiles and notify parent when new tiles are generated
  useEffect(() => {
    setCurrentTiles(newTiles);
    if (onGridCreated) {
      onGridCreated(newTiles);
    }
  }, [newTiles, onGridCreated]);

  return (
    <group>
      {currentTiles.map((tile) => (
        <HexTile
          key={tile.id}
          tile={tile}
          hexSize={config.hexSize}
        />
      ))}
      <Tree tiles={currentTiles} hexSize={config.hexSize} />
      <Grass tiles={currentTiles} hexSize={config.hexSize} />
      <Stone tiles={currentTiles} hexSize={config.hexSize} />
    </group>
  );
} 