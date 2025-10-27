
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { Level, MonsterSpawn } from '@/lib/types';
import { produce } from 'immer';

interface MonsterEncounterDialogProps {
  level: Level;
  children: React.ReactNode;
}

export function MonsterEncounterDialog({ level, children }: MonsterEncounterDialogProps) {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  const [isOpen, setIsOpen] = useState(false);
  const [encounterRate, setEncounterRate] = useState(level.encounterRate ?? 0);
  const [monsterSpawns, setMonsterSpawns] = useState<MonsterSpawn[]>(level.monsterSpawns ?? []);

  useEffect(() => {
    setEncounterRate(level.encounterRate ?? 0);
    setMonsterSpawns(level.monsterSpawns ?? []);
  }, [level]);

  const handleSave = () => {
    const totalSpawnChance = monsterSpawns.reduce((sum, spawn) => sum + spawn.chance, 0);
    if (totalSpawnChance > 100) {
        toast({
            title: "Invalid Spawn Rates",
            description: `Total monster spawn chance cannot exceed 100%. Current total: ${totalSpawnChance}%`,
            variant: "destructive"
        });
        return;
    }

    dispatch({
      type: 'UPDATE_ENCOUNTER_DATA',
      payload: { levelId: level.id, encounterRate, monsterSpawns },
    });
    toast({
      title: 'Encounters Saved',
      description: `Encounter data for level "${level.name}" has been updated.`,
    });
    setIsOpen(false);
  };

  const handleAddSpawn = () => {
    if (!currentProject?.monsters || currentProject.monsters.length === 0) {
        toast({ title: "No monsters defined", description: "Please add monsters in the Combat panel first.", variant: "destructive" });
        return;
    }
    const newSpawn: MonsterSpawn = { monsterId: currentProject.monsters[0].id, chance: 10 };
    setMonsterSpawns(produce(monsterSpawns, draft => {
        draft.push(newSpawn);
    }));
  };

  const handleRemoveSpawn = (index: number) => {
    setMonsterSpawns(produce(monsterSpawns, draft => {
        draft.splice(index, 1);
    }));
  };

  const handleSpawnChange = (index: number, field: keyof MonsterSpawn, value: number) => {
    setMonsterSpawns(produce(monsterSpawns, draft => {
        draft[index][field] = value;
    }));
  };

  const totalSpawnChance = monsterSpawns.reduce((sum, spawn) => sum + spawn.chance, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Monster Encounters</DialogTitle>
          <DialogDescription>
            Configure random monster encounters for {level.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label htmlFor="encounter-rate">Overall Encounter Rate</Label>
                <span className="text-sm text-muted-foreground">{encounterRate}%</span>
            </div>
            <Slider
              id="encounter-rate"
              min={0}
              max={100}
              step={1}
              value={[encounterRate]}
              onValueChange={(value) => setEncounterRate(value[0])}
            />
          </div>

          <div className="space-y-4">
            <Label>Monster Spawns</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {monsterSpawns.map((spawn, index) => {
                const monster = currentProject?.monsters.find(m => m.id === spawn.monsterId);
                return (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <Select
                      value={spawn.monsterId.toString()}
                      onValueChange={(value) => handleSpawnChange(index, 'monsterId', parseInt(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Monster" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentProject?.monsters.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name} (Lvl {m.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={spawn.chance}
                      onChange={(e) => handleSpawnChange(index, 'chance', parseInt(e.target.value, 10))}
                      className="w-20"
                      min="0"
                      max="100"
                    />
                    <span className="text-muted-foreground">%</span>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveSpawn(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddSpawn}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Monster
            </Button>
            <div className="text-sm text-muted-foreground flex justify-between">
                <span>Total Spawn Chance:</span>
                <span className={totalSpawnChance > 100 ? 'text-destructive font-bold' : ''}>{totalSpawnChance}% / 100%</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
