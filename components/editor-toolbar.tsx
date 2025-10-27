
'use client';

import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from '@/components/ui/separator';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ToyBrick, AlertTriangle, User, MousePointer, Image, FilePlus, Swords } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { cn } from "@/lib/utils";
import type { EditMode } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';


const editorModes: { id: EditMode, label: string, icon: React.ElementType }[] = [
    { id: 'select', label: 'Select', icon: MousePointer },
    { id: 'collision', label: 'Collision', icon: Shield },
    { id: 'object', label: 'Object', icon: ToyBrick },
    { id: 'trigger', label: 'Trigger', icon: AlertTriangle },
  ];

export function EditorToolbar() {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();

    const [newLevelName, setNewLevelName] = useState('');
    const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
    
    const currentProject = state.projects.find(p => p.id === state.currentProjectId);

    const setEditMode = (mode: EditMode) => {
        dispatch({ type: 'SET_EDIT_MODE', payload: { mode } });
    }

    const handleTriggerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const id = parseInt(e.target.value, 10);
        if (!isNaN(id)) {
            dispatch({ type: 'SET_TRIGGER_ID', payload: { triggerId: id } });
        }
    }

    const handleObjectIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const id = parseInt(e.target.value, 10);
        if (!isNaN(id)) {
            dispatch({ type: 'SET_OBJECT_ID', payload: { objectId: id } });
        }
    }

      const handleCreateLevel = () => {
        if (newLevelName.trim()) {
            dispatch({ type: 'ADD_LEVEL', payload: { name: newLevelName.trim() } });
            setNewLevelName('');
            setIsLevelDialogOpen(false);
        }
      }

      const handleLevelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCreateLevel();
        }
      }

    return (
        <div className="flex items-center gap-2 p-1 rounded-lg bg-card border">
            <TooltipProvider>
                <div className="flex items-center gap-2">
                    <AlertDialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <FilePlus className="h-5 w-5" />
                                        <span className="sr-only">Add Level</span>
                                    </Button>
                                </AlertDialogTrigger>
                             </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Add Level</p>
                            </TooltipContent>
                         </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Create New Level</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter a name for your new level.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input placeholder="Level Name" value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} onKeyDown={handleLevelKeyDown}/>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCreateLevel}>Create</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9", state.editMode === 'assets' && "bg-accent text-accent-foreground")}
                                onClick={() => setEditMode('assets')}
                            >
                                <Image className="h-5 w-5" />
                                <span className="sr-only">Change Assets</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Assets</p>
                        </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9", state.editMode === 'combat' && "bg-accent text-accent-foreground")}
                                onClick={() => setEditMode('combat')}
                            >
                                <Swords className="h-5 w-5" />
                                <span className="sr-only">Combat Settings</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Combat</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <TooltipProvider>
                <div className="flex items-center gap-2">
                    {editorModes.map(mode => (
                        <Tooltip key={mode.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9",
                                        state.editMode === mode.id && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => setEditMode(mode.id)}
                                >
                                    <mode.icon className="h-5 w-5" />
                                    <span className="sr-only">{mode.label}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{mode.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9", state.editMode === 'player' && "bg-accent text-accent-foreground")}
                                onClick={() => setEditMode('player')}
                            >
                                <User className="h-5 w-5" />
                                <span className="sr-only">Player Start</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                           <p>Player Start</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>

            {state.editMode === 'trigger' && (
                <div className="flex items-center gap-2 pl-2">
                    <Label htmlFor="trigger-id" className="text-sm">Trigger ID:</Label>
                    <Input
                        id="trigger-id"
                        type="number"
                        value={state.currentTriggerId}
                        onChange={handleTriggerIdChange}
                        className="h-8 w-20"
                        min="1"
                    />
                </div>
            )}
             {state.editMode === 'object' && (
                <div className="flex items-center gap-2 pl-2">
                    <Label htmlFor="object-id" className="text-sm">Object ID:</Label>
                    <Input
                        id="object-id"
                        type="number"
                        value={state.currentObjectId}
                        onChange={handleObjectIdChange}
                        className="h-8 w-20"
                        min="1"
                    />
                </div>
            )}
        </div>
    )
}
