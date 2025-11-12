

'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { ObjectAction, ObjectActionType, MiniMenuAction, ChangeLevelValue, Level, AudioAsset, Monster } from '@/lib/types';
import { produce } from 'immer';

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


export function ObjectInteractionPanel() {
  const { state, dispatch } = useAppContext();
  const { selectedObject } = state;
  
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);
  const currentLevel = currentProject?.levels.find(l => l.id === selectedObject?.levelId);
  const objectActions = currentLevel?.objectActions?.[selectedObject?.objectId ?? -1] ?? [];
  
  const [actions, setActions] = useState<ObjectAction[]>(objectActions);

  useEffect(() => {
    setActions(currentLevel?.objectActions?.[selectedObject?.objectId ?? -1] ?? []);
  }, [selectedObject, currentLevel]);

  const handleUpdateActions = (newActions: ObjectAction[]) => {
    if (!selectedObject) return;
    setActions(newActions);
    dispatch({ type: 'UPDATE_OBJECT_ACTION', payload: { ...selectedObject, actions: newActions } });
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
    dispatch({ type: 'SET_LEVEL_TRANSITION_TARGET', payload: null });
  }

  const handleActionChange = (index: number, newAction: ObjectAction) => {
    const newActions = produce(actions, draft => {
        draft[index] = newAction;
    });
    handleUpdateActions(newActions);
  }

  if (!selectedObject) {
    return null;
  }
  
  return (
    <div className="px-4 py-1 space-y-4">
      <div>
        <h3 className="font-semibold">Object #{selectedObject.objectId} Interactions</h3>
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

interface ActionEditorProps {
    action: ObjectAction;
    onChange: (action: ObjectAction) => void;
    onRemove?: () => void;
    levelList: Level[];
    audioList: AudioAsset[];
    monsterList: Monster[];
}

export const ActionEditor: React.FC<ActionEditorProps> = ({ action, onChange, onRemove, levelList, audioList, monsterList }) => {
    const { dispatch } = useAppContext();
    const [isFocused, setIsFocused] = useState(false);

    const handleTypeChange = (type: ObjectActionType) => {
        let value: ObjectAction['value'];
        switch (type) {
            case 'message':
                value = '';
                break;
            case 'changeLevel':
                value = { levelId: levelList[0]?.id || '', x: 0, y: 0 };
                dispatch({ type: 'SET_LEVEL_TRANSITION_TARGET', payload: { levelId: levelList[0]?.id, x: 0, y: 0 }});
                break;
            case 'playMusic':
                value = audioList && audioList.length > 0 ? audioList[0].fileName : '';
                break;
            case 'showHideObject':
                value = { id: 1, state: 'show' };
                break;
            case 'showHidePlayer':
                value = { state: 'show' };
                break;
            case 'miniMenu':
                value = { 
                    options: [
                        { text: 'Option 1', actions: [] },
                        { text: 'Option 2', actions: [] }
                    ]
                };
                break;
            case 'startBattle':
                value = monsterList.length > 0 ? monsterList[0].id : 0;
                break;
            case 'restoreHealth':
            case 'restoreMana':
                value = 10;
                break;
            default:
                value = '';
                break;
        }
        const newAction: ObjectAction = { type, value };
        onChange(newAction);
    }

    const handleFocus = () => {
        setIsFocused(true);
        if (action.type === 'changeLevel') {
            const { levelId, x, y } = action.value as ChangeLevelValue;
             if (levelId && x !== undefined && y !== undefined) {
                dispatch({ type: 'SET_LEVEL_TRANSITION_TARGET', payload: { levelId, x, y }});
            }
        }
    }

    const handleBlur = () => {
        setIsFocused(false);
        dispatch({ type: 'SET_LEVEL_TRANSITION_TARGET', payload: null });
    }

    const handleActionValueChange = (value: ObjectAction['value']) => {
        onChange({ ...action, value });
        if (action.type === 'changeLevel') {
             const { levelId, x, y } = value as ChangeLevelValue;
             if (levelId && x !== undefined && y !== undefined) {
                dispatch({ type: 'SET_LEVEL_TRANSITION_TARGET', payload: { levelId, x, y }});
            }
        }
    }
    
    return (
        <div className="p-3 border rounded-lg space-y-2 relative bg-card" onFocus={handleFocus} onBlur={handleBlur}>
            <div className='flex justify-between items-center'>
                <Label>Action Type</Label>
                {onRemove && <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-1 right-1" onClick={onRemove}><X className="h-4 w-4" /></Button>}
            </div>
            <Select value={action.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="message">Show Message</SelectItem>
                    <SelectItem value="changeLevel">Change Level</SelectItem>
                    <SelectItem value="stopMusic">Stop Music</SelectItem>
                    <SelectItem value="playMusic">Play Music</SelectItem>
                    <SelectItem value="showHideObject">Show/Hide Object</SelectItem>
                    <SelectItem value="showHidePlayer">Show/Hide Player</SelectItem>
                    <SelectItem value="miniMenu">Mini Menu</SelectItem>
                    <SelectItem value="startBattle">Start Battle</SelectItem>
                    <SelectItem value="restoreHealth">Restore Health</SelectItem>
                    <SelectItem value="restoreMana">Restore Mana</SelectItem>
                </SelectContent>
            </Select>

            {action.type === 'message' && (
                 <Textarea placeholder="Message to display" value={action.value as string} onChange={e => handleActionValueChange(e.target.value)} maxLength={48} />
            )}
            {(action.type === 'restoreHealth' || action.type === 'restoreMana') && (
                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={action.value as number} onChange={e => handleActionValueChange(parseInt(e.target.value, 10) || 0)} />
                </div>
            )}
            {action.type === 'changeLevel' && typeof action.value === 'object' && 'levelId' in action.value && (
                <div className='space-y-2'>
                     <Select value={(action.value as ChangeLevelValue).levelId} onValueChange={v => handleActionValueChange({...(action.value as ChangeLevelValue), levelId: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            {levelList.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number"
                            placeholder="X"
                            value={(action.value as ChangeLevelValue).x ?? ''}
                            onChange={e => handleActionValueChange({ ...(action.value as ChangeLevelValue), x: parseInt(e.target.value) || 0 })}
                            className="w-1/2"
                            max={(levelList.find(l => l.id === (action.value as ChangeLevelValue).levelId)?.width ?? 1) - 1}
                            min={0}
                        />
                         <Input 
                            type="number"
                            placeholder="Y"
                            value={(action.value as ChangeLevelValue).y ?? ''}
                            onChange={e => handleActionValueChange({ ...(action.value as ChangeLevelValue), y: parseInt(e.target.value) || 0 })}
                            className="w-1/2"
                            max={(levelList.find(l => l.id === (action.value as ChangeLevelValue).levelId)?.height ?? 1) - 1}
                            min={0}
                        />
                    </div>
                </div>
            )}
            {action.type === 'playMusic' && (
                 <Select value={action.value as string} onValueChange={v => handleActionValueChange(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select music file" />
                    </SelectTrigger>
                    <SelectContent>
                        {audioList.map(a => <SelectItem key={a.fileName} value={a.fileName}>{a.fileName}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
             {action.type === 'showHideObject' && typeof action.value === 'object' && 'id' in action.value && (
                <div className='flex gap-2'>
                     <Input type="number" placeholder="Object ID" value={(action.value as {id: number}).id} onChange={e => handleActionValueChange({ ...(action.value as object), id: parseInt(e.target.value,10) })}/>
                     <Select value={(action.value as {state: 'show' | 'hide'}).state} onValueChange={(v: 'show' | 'hide') => handleActionValueChange({ ...(action.value as object), state: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="show">Show</SelectItem>
                            <SelectItem value="hide">Hide</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            {action.type === 'showHidePlayer' && typeof action.value === 'object' && 'state' in action.value && (
                <Select value={(action.value as {state: 'show' | 'hide'}).state} onValueChange={(v: 'show' | 'hide') => handleActionValueChange({ state: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="hide">Hide</SelectItem>
                    </SelectContent>
                </Select>
            )}
            {action.type === 'startBattle' && (
                 <Select value={(action.value as number).toString()} onValueChange={v => handleActionValueChange(parseInt(v, 10))}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select monster" />
                    </SelectTrigger>
                    <SelectContent>
                        {monsterList.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            {action.type === 'miniMenu' && typeof action.value === 'object' && 'options' in action.value && Array.isArray((action.value as { options: MiniMenuAction[] }).options) && (
                <div className='space-y-3 pt-2'>
                    {(action.value as { options: MiniMenuAction[] }).options.map((opt, i) => (
                        <div key={i} className="p-2 border rounded-md bg-background/50 relative">
                            <div className='flex justify-between items-center mb-2'>
                                <Label>Option {i + 1}</Label>
                                { (action.value as { options: MiniMenuAction[] }).options.length > 2 &&
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                    const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                        draft.splice(i, 1);
                                    });
                                    onChange({...action, value: { options: newOptions }});
                                }}><X className="h-4 w-4" /></Button>
                                }
                            </div>
                            <Input 
                                placeholder={`Option text`} 
                                value={opt.text} 
                                onChange={e => {
                                    const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                        draft[i].text = e.target.value;
                                    });
                                    onChange({...action, value: { options: newOptions }});
                                }}
                                className="mb-2"
                            />
                            <div className="mt-2 space-y-2">
                                <AddActionButton onAdd={() => {
                                     const newSubAction: ObjectAction = {type: 'message', value: '...'};
                                      const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                        if (!draft[i].actions) {
                                            draft[i].actions = [];
                                        }
                                        draft[i].actions.push(newSubAction);
                                    });
                                    onChange({...action, value: { options: newOptions }});
                                }} />
                                {(opt.actions || []).map((subAction, subIndex) => (
                                    <React.Fragment key={subIndex}>
                                        <ActionEditor
                                            action={subAction}
                                            onChange={newSubAction => {
                                                const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                                    if (!draft[i].actions) {
                                                        draft[i].actions = [];
                                                    }
                                                    draft[i].actions[subIndex] = newSubAction;
                                                });
                                                onChange({...action, value: { options: newOptions }});
                                            }}
                                            onRemove={() => {
                                                const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                                    draft[i].actions.splice(subIndex, 1);
                                                });
                                                onChange({...action, value: { options: newOptions }});
                                            }}
                                            levelList={levelList}
                                            audioList={audioList}
                                            monsterList={monsterList}
                                        />
                                        <AddActionButton onAdd={() => {
                                            const newSubAction: ObjectAction = {type: 'message', value: '...'};
                                            const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                                                if (!draft[i].actions) {
                                                    draft[i].actions = [];
                                                }
                                                draft[i].actions.splice(subIndex + 1, 0, newSubAction);
                                            });
                                            onChange({...action, value: { options: newOptions }});
                                        }} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => {
                        const newOption: MiniMenuAction = { text: `Option ${ (action.value as { options: MiniMenuAction[] }).options.length + 1}`, actions: [] };
                         const newOptions = produce((action.value as { options: MiniMenuAction[] }).options, draft => {
                            draft.push(newOption);
                        });
                        onChange({...action, value: { options: newOptions }});
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                </div>
            )}
        </div>
    )
}
