
'use client';

import type { Level } from '@/lib/types';
import { CellType } from '@/lib/types';
import { GridCell } from '@/components/grid-cell';
import { useAppContext } from '@/context/app-context';
import React, { useState, useEffect, useRef } from 'react';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tent } from 'lucide-react';


const TILE_SIZE = 16;
const LEVEL_WIDTH = 240;
const LEVEL_HEIGHT = 160;


interface LevelEditorProps {
  level: Level;
}

export function LevelEditor({ level }: LevelEditorProps) {
  const { state, dispatch } = useAppContext();
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [levelName, setLevelName] = useState(level.name);

  const handleLevelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLevelName(e.target.value);
  }

  const handleLevelNameBlur = () => {
    dispatch({ type: 'UPDATE_LEVEL_NAME', payload: { levelId: level.id, name: levelName } });
  }

  const handleLevelNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLevelNameBlur();
      e.currentTarget.blur();
    }
  }

  const handleCellClick = (x: number, y: number) => {
    if (state.editMode !== 'select') {
        return;
    }
    const cell = level.grid[y][x];
    if (cell.type === CellType.Object && cell.objectId !== undefined) {
        dispatch({ type: 'SELECT_OBJECT', payload: { levelId: level.id, objectId: cell.objectId } });
    } else if (cell.type === CellType.Trigger && cell.triggerId !== undefined) {
        dispatch({ type: 'SELECT_TRIGGER', payload: { levelId: level.id, triggerId: cell.triggerId } });
    } else {
        dispatch({ type: 'SELECT_OBJECT', payload: null });
        dispatch({ type: 'SELECT_TRIGGER', payload: null });
    }
  }

  const handlePaint = (x: number, y: number, erase = false) => {
    if (state.editMode === 'select') return;
    
    let newPlayerStart = level.playerStart;
    
    const newGrid = produce(level.grid, draftGrid => {
        const currentCell = draftGrid[y][x];

        // Clear player if we draw on its start position
        if (level.playerStart?.x === x && level.playerStart?.y === y) {
            newPlayerStart = null;
        }

        if (erase) {
            currentCell.type = CellType.Empty;
            delete currentCell.triggerId;
            delete currentCell.objectId;
            return;
        }

        // Place new entity, ensuring only one entity per cell
        const placeNewEntity = (newType: CellType) => {
            if (currentCell.type === newType) { // Toggle off if same type
                if (newType === CellType.Trigger && currentCell.triggerId !== state.currentTriggerId) {
                    // If it is a trigger but with different ID, just update it
                } else if (newType === CellType.Object && currentCell.objectId !== state.currentObjectId) {
                    // If it is an object but with different ID, just update it
                }
                else {
                    currentCell.type = CellType.Empty;
                    delete currentCell.triggerId;
                    delete currentCell.objectId;
                    return;
                }
            }
            
            currentCell.type = newType;
            delete currentCell.triggerId;
            delete currentCell.objectId;

            switch(newType) {
                case CellType.Trigger:
                    currentCell.triggerId = state.currentTriggerId;
                    break;
                case CellType.Object:
                    currentCell.objectId = state.currentObjectId;
                    break;
            }
        }


        switch(state.editMode) {
            case 'collision':
                placeNewEntity(CellType.Solid);
                break;
            case 'object':
                placeNewEntity(CellType.Object);
                break;
            case 'trigger':
                placeNewEntity(CellType.Trigger);
                break;
            case 'player':
                newPlayerStart = { x, y };
                // Ensure player start cell is empty of other entities
                if (draftGrid[y][x].type !== CellType.Empty) {
                    draftGrid[y][x].type = CellType.Empty;
                    delete draftGrid[y][x].triggerId;
                    delete draftGrid[y][x].objectId;
                }
                break;
        }
    });

    dispatch({ type: 'UPDATE_LEVEL_DATA', payload: { levelId: level.id, grid: newGrid, playerStart: newPlayerStart }});
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => {
    e.preventDefault();
    if (state.editMode === 'select') {
        return;
    }
    if (e.button === 2) {
        setIsErasing(true);
        handlePaint(x, y, true);
    } else {
        setIsPainting(true);
        handlePaint(x, y, false);
    }
  }

  const handleMouseEnter = (x: number, y: number) => {
    if (isPainting) {
        handlePaint(x, y, false);
    } else if (isErasing) {
        handlePaint(x, y, true);
    }
  }

  const handleMouseUp = () => {
    setIsPainting(false);
    setIsErasing(false);
  }

  useEffect(() => {
    const editorElement = editorRef.current;
    
    const stopPainting = () => {
        setIsPainting(false);
        setIsErasing(false);
    }

    if (editorElement) {
        editorElement.addEventListener('mouseup', stopPainting);
        editorElement.addEventListener('mouseleave', stopPainting);
    }
    return () => {
        if (editorElement) {
            editorElement.removeEventListener('mouseup', stopPainting);
            editorElement.removeEventListener('mouseleave', stopPainting);
        }
    }
  }, []);

  const isCurrentLevel = level.id === state.currentLevelId;
  const isSelectedObjectInThisLevel = state.selectedObject?.levelId === level.id;
  const isSelectedTriggerInThisLevel = state.selectedTrigger?.levelId === level.id;


  return (
    <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
            <Input 
                type="text"
                value={levelName}
                onChange={handleLevelNameChange}
                onBlur={handleLevelNameBlur}
                onKeyDown={handleLevelNameKeyDown}
                className="w-36 text-center bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
            />
        </div>
        <div 
            ref={editorRef}
            className="relative bg-black border-2 border-accent shadow-lg shadow-accent/20" 
            style={{ 
                width: LEVEL_WIDTH + 2,
                height: LEVEL_HEIGHT + 2,
             }}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => {
              if (state.currentLevelId !== level.id) {
                dispatch({ type: 'SELECT_LEVEL', payload: { levelId: level.id } })
              }
            }}
        >
            <div
                className="absolute overflow-hidden"
                style={{
                  top: '0px',
                  left: '0px',
                  width: LEVEL_WIDTH,
                  height: LEVEL_HEIGHT,
                }}
            >
                {level.backgroundImage && (
                    <div
                        className="absolute"
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${level.backgroundImage.dataUrl})`,
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                        }}
                    />
                )}
            </div>
            <div
                className="relative grid"
                style={{
                    gridTemplateColumns: `repeat(${level.width}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${level.height}, ${TILE_SIZE}px)`,
                    width: LEVEL_WIDTH,
                    height: LEVEL_HEIGHT,
                    cursor: state.editMode === 'player' ? 'crosshair' : (state.editMode === 'select' ? 'default' : 'pointer'),
                    top: '0px',
                    left: '0px',
                }}
                onMouseUp={handleMouseUp}
            >
                {level.grid.map((row, y) =>
                    row.map((cell, x) => (
                        <div 
                            key={`${x}-${y}`}
                            onMouseDown={(e) => handleMouseDown(e, x, y)}
                            onMouseEnter={() => handleMouseEnter(x, y)}
                            onClick={() => handleCellClick(x, y)}
                        >
                            <GridCell
                                cellData={cell}
                                isPlayerStart={level.playerStart?.x === x && level.playerStart?.y === y}
                                isTransitionTarget={state.levelTransitionTarget?.levelId === level.id && state.levelTransitionTarget?.x === x && state.levelTransitionTarget?.y === y}
                                isCurrentLevel={isCurrentLevel}
                                isSelectedObject={isSelectedObjectInThisLevel && cell.objectId === state.selectedObject?.objectId}
                                isSelectedTrigger={isSelectedTriggerInThisLevel && cell.triggerId === state.selectedTrigger?.triggerId}
                            />
                        </div>
                    ))
                )}
            </div>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none"
                 style={{
                    top: '0px',
                    left: '0px',
                    width: LEVEL_WIDTH,
                    height: LEVEL_HEIGHT,
                    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                    backgroundImage: `
                        linear-gradient(to right, hsl(var(--border) / 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--border) / 0.2) 1px, transparent 1px)
                    `,
                }}
            />
        </div>
    </div>
  );
}
