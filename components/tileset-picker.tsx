'use client';

import React from 'react';
import Image from 'next/image';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';

const TILE_SIZE = 16;
const TILESET_WIDTH_IN_TILES = 16;
const TILESET_HEIGHT_IN_TILES = 16;

export function TilesetPicker() {
  const { state, dispatch } = useAppContext();
  const tilesetImage = PlaceHolderImages.find(img => img.id === 'tileset1');

  if (!tilesetImage) return null;

  const handleTileSelect = (tileId: number) => {
    dispatch({ type: 'SELECT_TILE', payload: { tileId } });
    dispatch({ type: 'SET_EDIT_MODE', payload: { mode: 'background' } });
  };

  const selectedX = state.selectedTileId !== null ? state.selectedTileId % TILESET_WIDTH_IN_TILES : -1;
  const selectedY = state.selectedTileId !== null ? Math.floor(state.selectedTileId / TILESET_WIDTH_IN_TILES) : -1;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tileset</SidebarGroupLabel>
      <div className="relative w-full aspect-square mt-2 cursor-pointer bg-black/50"
        onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / (rect.width / TILESET_WIDTH_IN_TILES));
            const y = Math.floor((e.clientY - rect.top) / (rect.height / TILESET_HEIGHT_IN_TILES));
            const tileId = y * TILESET_WIDTH_IN_TILES + x;
            handleTileSelect(tileId);
        }}
      >
        <Image
          src={tilesetImage.imageUrl}
          alt={tilesetImage.description}
          data-ai-hint={tilesetImage.imageHint}
          width={256}
          height={256}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none"
             style={{
                backgroundSize: `${100 / TILESET_WIDTH_IN_TILES}% ${100 / TILESET_HEIGHT_IN_TILES}%`,
                backgroundImage: `
                    linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)
                `,
            }}
        />
        {state.selectedTileId !== null && state.editMode === 'background' && (
             <div className="absolute pointer-events-none border-2 border-accent"
                style={{
                    left: `${selectedX * (100 / TILESET_WIDTH_IN_TILES)}%`,
                    top: `${selectedY * (100 / TILESET_HEIGHT_IN_TILES)}%`,
                    width: `${100 / TILESET_WIDTH_IN_TILES}%`,
                    height: `${100 / TILESET_HEIGHT_IN_TILES}%`,
                }}
             />
        )}
      </div>
    </SidebarGroup>
  );
}
