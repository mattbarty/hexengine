'use client';

import { useState } from 'react';
import HexWorld from './components/hexworld/HexWorld';
import InfoSidebar from './components/hexworld/InfoSidebar';
import { HexTile, WorldConfig } from './types';

// Default world configuration
const defaultWorldConfig: WorldConfig = {
  grid: {
    radius: 10,
    hexSize: 1,
    gridHeight: 6,
    noiseScale: 1.2,
    waterThreshold: 0.35,
    forestThreshold: 0.6,
    mountainThreshold: 0.75,
    sandThreshold: 0.3
  },
  camera: {
    position: [0, 20, 25],
    rotation: [-Math.PI / 3, 0, 0],
    fov: 45
  },
  seed: Math.floor(Math.random() * 10000)
};

export default function Home() {
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
  const [worldConfig] = useState<WorldConfig>(defaultWorldConfig);

  const handleTileSelect = (tile: HexTile | null) => {
    setSelectedTile(tile);
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-grow relative">
        <div className="absolute inset-0">
          <HexWorld config={worldConfig} onTileSelect={handleTileSelect} />
        </div>
      </div>
      <InfoSidebar selectedTile={selectedTile} />
    </div>
  );
}
