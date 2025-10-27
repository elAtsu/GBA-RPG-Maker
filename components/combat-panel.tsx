
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Swords } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import type { PlayerStats, Monster, MonsterSpriteData } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { SpritePreview } from './sprite-preview';
import { produce } from 'immer';

const defaultPlayerStats: PlayerStats = { 
    level: 1, 
    health: 20, 
    maxHealth: 20,
    mana: 10,
    maxMana: 10,
    attack: 5, 
    magicAttack: 8,
    speed: 5, 
    exp: 0,
    expToNextLevel: 100,
    potions: 3,
    smokeBombs: 1,
};

export function CombatPanel() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(currentProject?.playerStats ?? defaultPlayerStats);
  
  // Monster state
  const [monsters, setMonsters] = useState<Monster[]>(currentProject?.monsters ?? []);
  const [newMonsterName, setNewMonsterName] = useState('');
  
  const monsterFileInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});


  useEffect(() => {
    if (currentProject) {
      setPlayerStats(currentProject.playerStats ?? defaultPlayerStats);
      setMonsters(currentProject.monsters ?? []);
    }
  }, [currentProject]);


  const handlePlayerStatChange = (field: keyof PlayerStats, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const newStats = { ...playerStats, [field]: numValue };
      setPlayerStats(newStats);
    }
  };

  const handlePlayerStatBlur = () => {
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { stats: playerStats } });
    toast({ title: "Player stats updated." });
  }
  
  const handleAddNewMonster = () => {
    if (!newMonsterName.trim()) {
      toast({ title: "Monster name required", variant: 'destructive' });
      return;
    }
    const newId = (monsters.reduce((maxId, m) => Math.max(m.id, maxId), 0) + 1);
    const newMonster: Monster = {
      id: newId,
      name: newMonsterName,
      level: 1,
      health: 10,
      attack: 5,
      speed: 5,
      sprite: null,
    };
    dispatch({ type: 'ADD_MONSTER', payload: { monster: newMonster }});
    setNewMonsterName('');
  }

  const handleMonsterStatChange = (id: number, field: keyof Omit<Monster, 'id' | 'name' | 'sprite'>, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const updatedMonsters = produce(monsters, draft => {
        const monster = draft.find(m => m.id === id);
        if (monster) {
            (monster[field] as number) = numValue;
        }
    });
    setMonsters(updatedMonsters);
  }

  const handleMonsterStatBlur = (id: number) => {
    const monster = monsters.find(m => m.id === id);
    if (monster) {
        dispatch({ type: 'UPDATE_MONSTER', payload: { monster } });
        toast({ title: `Monster "${monster.name}" updated.` });
    }
  }
  
  const handleMonsterNameChange = (id: number, value: string) => {
     const updatedMonsters = produce(monsters, draft => {
        const monster = draft.find(m => m.id === id);
        if (monster) {
            monster.name = value;
        }
    });
    setMonsters(updatedMonsters);
  }

  const handleDeleteMonster = (id: number) => {
    dispatch({ type: 'DELETE_MONSTER', payload: { id }});
  }

  const handleMonsterSpriteUploadClick = (monsterId: number) => {
    monsterFileInputRefs.current[monsterId]?.click();
  };
  
  const handleMonsterFileChange = (event: React.ChangeEvent<HTMLInputElement>, monsterId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file (32x32).",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          if (img.width !== 32 || img.height !== 32) {
            toast({
              title: "Invalid Dimensions",
              description: "Monster sprite must be 32x32 pixels.",
              variant: "destructive",
            });
            return;
          }
          const monsterSprite: MonsterSpriteData = { dataUrl, fileName: file.name };
          const monster = monsters.find(m => m.id === monsterId);
          if (monster) {
            const updatedMonster = { ...monster, sprite: monsterSprite };
            dispatch({ type: 'UPDATE_MONSTER', payload: { monster: updatedMonster } });
            toast({
              title: "Monster sprite uploaded",
              description: `Sprite for ${monster.name} updated.`,
            });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="px-4 py-1 space-y-6">
      <SidebarGroup>
          <SidebarGroupLabel>Player Stats</SidebarGroupLabel>
          <p className="text-xs text-muted-foreground pb-2">Configure the player's combat statistics and inventory.</p>
          <div className='grid grid-cols-2 gap-4'>
              <div>
                  <Label htmlFor="player-level">Starting Level</Label>
                  <Input id="player-level" type="number" value={playerStats.level} onChange={e => handlePlayerStatChange('level', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
              <div>
                  <Label htmlFor="player-health">Max Health</Label>
                  <Input id="player-health" type="number" value={playerStats.maxHealth} onChange={e => handlePlayerStatChange('maxHealth', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
               <div>
                  <Label htmlFor="player-mana">Max Mana</Label>
                  <Input id="player-mana" type="number" value={playerStats.maxMana} onChange={e => handlePlayerStatChange('maxMana', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
              <div>
                  <Label htmlFor="player-attack">Attack</Label>
                  <Input id="player-attack" type="number" value={playerStats.attack} onChange={e => handlePlayerStatChange('attack', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
               <div>
                  <Label htmlFor="player-magic-attack">Magic Attack</Label>
                  <Input id="player-magic-attack" type="number" value={playerStats.magicAttack} onChange={e => handlePlayerStatChange('magicAttack', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
              <div>
                  <Label htmlFor="player-speed">Speed</Label>
                  <Input id="player-speed" type="number" value={playerStats.speed} onChange={e => handlePlayerStatChange('speed', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
               <div>
                  <Label htmlFor="player-potions">Potions</Label>
                  <Input id="player-potions" type="number" value={playerStats.potions} onChange={e => handlePlayerStatChange('potions', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
               <div>
                  <Label htmlFor="player-smoke-bombs">Smoke Bombs</Label>
                  <Input id="player-smoke-bombs" type="number" value={playerStats.smokeBombs} onChange={e => handlePlayerStatChange('smokeBombs', e.target.value)} onBlur={handlePlayerStatBlur} />
              </div>
          </div>
      </SidebarGroup>
      
      <Separator />

      <SidebarGroup>
          <SidebarGroupLabel>Monsters</SidebarGroupLabel>
          <div className="space-y-4 mt-2">
            {monsters.map(monster => (
              <div key={monster.id} className="p-3 border rounded-lg bg-card/50 space-y-3">
                <div className="flex justify-between items-center">
                    <Input className="text-lg font-semibold border-0 p-0 h-auto bg-transparent focus-visible:ring-0" value={monster.name} onChange={e => handleMonsterNameChange(monster.id, e.target.value)} onBlur={() => handleMonsterStatBlur(monster.id)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMonster(monster.id)}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>

                {monster.sprite && <SpritePreview dataUrl={monster.sprite.dataUrl} height={32} />}
                
                <input
                    type="file"
                    ref={el => monsterFileInputRefs.current[monster.id] = el}
                    className="hidden"
                    accept=".bmp"
                    onChange={e => handleMonsterFileChange(e, monster.id)}
                />
                <Button variant="outline" size="sm" onClick={() => handleMonsterSpriteUploadClick(monster.id)} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload 32x32 BMP
                </Button>

                <div className='grid grid-cols-2 gap-2'>
                    <div>
                        <Label htmlFor={`monster-level-${monster.id}`}>Level</Label>
                        <Input id={`monster-level-${monster.id}`} type="number" value={monster.level} onChange={e => handleMonsterStatChange(monster.id, 'level', e.target.value)} onBlur={() => handleMonsterStatBlur(monster.id)} />
                    </div>
                    <div>
                        <Label htmlFor={`monster-health-${monster.id}`}>Health</Label>
                        <Input id={`monster-health-${monster.id}`} type="number" value={monster.health} onChange={e => handleMonsterStatChange(monster.id, 'health', e.target.value)} onBlur={() => handleMonsterStatBlur(monster.id)} />
                    </div>
                    <div>
                        <Label htmlFor={`monster-attack-${monster.id}`}>Attack</Label>
                        <Input id={`monster-attack-${monster.id}`} type="number" value={monster.attack} onChange={e => handleMonsterStatChange(monster.id, 'attack', e.target.value)} onBlur={() => handleMonsterStatBlur(monster.id)} />
                    </div>
                    <div>
                        <Label htmlFor={`monster-speed-${monster.id}`}>Speed</Label>
                        <Input id={`monster-speed-${monster.id}`} type="number" value={monster.speed} onChange={e => handleMonsterStatChange(monster.id, 'speed', e.target.value)} onBlur={() => handleMonsterStatBlur(monster.id)} />
                    </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4"/>

          <div className="p-3 border rounded-lg space-y-3 border-dashed">
            <h4 className="font-semibold text-muted-foreground">Add New Monster</h4>
            <div className="space-y-2">
                <Label htmlFor="new-monster-name">Name</Label>
                <Input
                    id="new-monster-name"
                    type="text"
                    value={newMonsterName}
                    onChange={(e) => setNewMonsterName(e.target.value)}
                    className="h-8"
                    placeholder="e.g. Slime"
                />
            </div>
            <Button variant="outline" size="sm" onClick={handleAddNewMonster} className="w-full">
                <Swords className="mr-2 h-4 w-4" />
                Add Monster
            </Button>
          </div>
      </SidebarGroup>
    </div>
  );
}
