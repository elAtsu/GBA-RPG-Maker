'use client';

import type { CellData } from '@/lib/types';
import { CellType } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridCellProps {
  cellData: CellData;
  isPlayerStart: boolean;
  isTransitionTarget: boolean;
  isCurrentLevel: boolean;
  isSelectedObject: boolean;
  isSelectedTrigger: boolean;
}

export function GridCell({ cellData, isPlayerStart, isTransitionTarget, isCurrentLevel, isSelectedObject, isSelectedTrigger }: GridCellProps) {
  const { state } = useAppContext();
  
  const getOverlay = () => {
    if (isPlayerStart) {
      return (
        <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
        </div>
      );
    }
    if (isTransitionTarget) {
        return (
          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white/70" />
          </div>
        );
    }

    switch (cellData.type) {
      case CellType.Solid:
        return <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center"><Shield className="w-3 h-3 text-white/80" /></div>;
      case CellType.Trigger:
        return (
            <div className="absolute inset-0 bg-yellow-400/40 flex items-center justify-center text-black/70 text-[10px] font-bold">
                <span className="z-10 relative drop-shadow-sm">{cellData.triggerId}</span>
            </div>
        );
      case CellType.Object:
        return (
            <div className="absolute inset-0 bg-blue-500/40 flex items-center justify-center text-white/80 text-[10px] font-bold">
                 <span className="z-10 relative drop-shadow-sm">{cellData.objectId}</span>
            </div>
        );
      default:
        break;
    }

    return null;
  };

  const isSelected = isSelectedObject || isSelectedTrigger;

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center select-none",
        isCurrentLevel && (state.editMode !== 'select') && "hover:bg-accent/20",
        isSelected && "outline outline-2 outline-accent outline-offset-[-2px]"
      )}
    >
      {getOverlay()}
    </div>
  );
}
