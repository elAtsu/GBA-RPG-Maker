
'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { ObjectAction } from '@/lib/types';
import { produce } from 'immer';
import { ActionEditor } from './object-interaction-panel';


const AddActionButton = ({ onAdd }: { onAdd: () => void }) => (
    <div className="relative h-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed"></span>
        </div>
        <div className="relative flex justify-center">
            <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full bg-background"
                onClick={onAdd}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    </div>
);


export function OnStartInteractionPanel() {
  const { state, dispatch } = useAppContext();
  
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);
  const currentLevel = currentProject?.levels.find(l => l.id === state.currentLevelId);
  const onStartActions = currentLevel?.onStartActions ?? [];
  
  const [actions, setActions] = useState<ObjectAction[]>(onStartActions);

  useEffect(() => {
    setActions(currentLevel?.onStartActions ?? []);
  }, [currentLevel]);

  const handleUpdateActions = (newActions: ObjectAction[]) => {
    if (!currentLevel) return;
    setActions(newActions);
    dispatch({ type: 'UPDATE_LEVEL_ON_START_ACTIONS', payload: { levelId: currentLevel.id, actions: newActions } });
  }

  const handleAddAction = (index: number) => {
    const newAction: ObjectAction = { type: 'message', value: '' };
    const newActions = produce(actions, draft => {
        draft.splice(index, 0, newAction);
    });
    handleUpdateActions(newActions);
  }

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    handleUpdateActions(newActions);
  }

  const handleActionChange = (index: number, newAction: ObjectAction) => {
    const newActions = produce(actions, draft => {
        draft[index] = newAction;
    });
    handleUpdateActions(newActions);
  }

  if (!currentLevel) {
    return (
        <div className="px-4 py-1 text-sm text-muted-foreground">
            Select a level to edit its on-start actions.
        </div>
    );
  }
  
  return (
    <div className="px-4 py-1 space-y-4">
      <div>
        <h3 className="font-semibold">On-Start Actions</h3>
        <p className="text-sm text-muted-foreground">Level: {currentLevel?.name}</p>
      </div>

      <div className="space-y-2">
        <AddActionButton onAdd={() => handleAddAction(0)} />
        {actions.map((action, index) => (
            <React.Fragment key={index}>
                <ActionEditor 
                    action={action} 
                    onChange={(newAction) => handleActionChange(index, newAction)}
                    onRemove={() => handleRemoveAction(index)}
                    levelList={currentProject?.levels ?? []}
                    audioList={currentProject?.audioAssets ?? []}
                    monsterList={currentProject?.monsters ?? []}
                />
                <AddActionButton onAdd={() => handleAddAction(index + 1)} />
            </React.Fragment>
        ))}
      </div>
    </div>
  );
}
