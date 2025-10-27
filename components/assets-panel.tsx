
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Music, MessageSquare, Swords } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import type { BackgroundImage, PlayerSpriteData, ObjectSpriteData, AudioAsset } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { SpritePreview } from './sprite-preview';

export function AssetsPanel() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const playerFileInputRef = React.useRef<HTMLInputElement>(null);
  const objectFileInputRef = React.useRef<HTMLInputElement>(null);
  const audioFileInputRef = React.useRef<HTMLInputElement>(null);
  const messageBoxFileInputRef = React.useRef<HTMLInputElement>(null);
  const battleBgFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  const [playerSpriteHeight, setPlayerSpriteHeight] = useState(currentProject?.playerSpriteData?.height ?? 16);
  
  // For adding a new object
  const [newObjectId, setNewObjectId] = useState(() => {
    const existingIds = Object.keys(currentProject?.objectSpriteData || {}).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  });
  const [newObjectSpriteHeight, setNewObjectSpriteHeight] = useState(16);

  const handleBackgroundUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleMessageBoxUploadClick = () => {
    messageBoxFileInputRef.current?.click();
  };

  const handleBattleBgUploadClick = () => {
    battleBgFileInputRef.current?.click();
  }

  const handlePlayerSpriteUploadClick = () => {
    playerFileInputRef.current?.click();
  }
  
  const handleObjectSpriteUploadClick = () => {
    if (currentProject?.objectSpriteData?.[newObjectId]) {
        toast({
            title: "ID in use",
            description: `Object ID ${newObjectId} already exists. Please choose another one.`,
            variant: "destructive",
        });
        return;
    }
    objectFileInputRef.current?.click();
  }

  const handleAudioUploadClick = () => {
    audioFileInputRef.current?.click();
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const backgroundImage: BackgroundImage = {
            dataUrl,
            fileName: file.name
        }
        dispatch({ type: 'SET_BACKGROUND_IMAGE', payload: { backgroundImage } });
        toast({
          title: 'Background uploaded',
          description: `${file.name} has been set as the background for the current level.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessageBoxFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const backgroundImage: BackgroundImage = {
            dataUrl,
            fileName: file.name
        }
        dispatch({ type: 'SET_MESSAGE_BOX_BACKGROUND', payload: { backgroundImage } });
        toast({
          title: 'Message Box Background Uploaded',
          description: `${file.name} has been set as the project-wide message box background.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBattleBgFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const backgroundImage: BackgroundImage = {
            dataUrl,
            fileName: file.name
        }
        dispatch({ type: 'SET_BATTLE_BACKGROUND', payload: { backgroundImage } });
        toast({
          title: 'Battle Background Uploaded',
          description: `${file.name} has been set as the project-wide battle background.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file for the player sprite.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const spriteData: PlayerSpriteData = {
            dataUrl,
            height: playerSpriteHeight
        }
        dispatch({ type: 'SET_PLAYER_SPRITE', payload: { spriteData } });
        toast({
          title: 'Player Sprite uploaded',
          description: `The player sprite has been updated.`,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  const handleObjectFileChange = (event: React.ChangeEvent<HTMLInputElement>, objectId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/bmp') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid BMP file for the object sprite.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const height = objectId === newObjectId 
            ? newObjectSpriteHeight 
            : currentProject?.objectSpriteData?.[objectId]?.height ?? 16;
        
        const spriteData: ObjectSpriteData = {
            dataUrl,
            height: height
        }
        dispatch({ type: 'SET_OBJECT_SPRITE', payload: { id: objectId, spriteData } });
        toast({
          title: 'Object Sprite Uploaded',
          description: `The sprite for object #${objectId} has been updated.`,
        });
        // Reset for next new object
        if (objectId === newObjectId) {
            setNewObjectId(newObjectId + 1);
            setNewObjectSpriteHeight(16);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!file.name.endsWith('.xm')) {
            toast({
                title: "Invalid File Type",
                description: "Please upload a valid .xm audio file.",
                variant: "destructive"
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const audioAsset: AudioAsset = {
                dataUrl,
                fileName: file.name,
            };
            dispatch({ type: 'ADD_AUDIO_ASSET', payload: { audioAsset }});
            toast({
                title: "Audio Asset Added",
                description: `${file.name} has been added to the project.`
            });
        };
        reader.readAsDataURL(file);
    }
  }

  const handlePlayerHeightChange = () => {
     if (currentProject?.playerSpriteData) {
        const spriteData: PlayerSpriteData = {
            ...currentProject.playerSpriteData,
            height: playerSpriteHeight
        }
        dispatch({ type: 'SET_PLAYER_SPRITE', payload: { spriteData } });
        toast({
          title: 'Player Sprite Height Updated',
          description: `The player sprite height is now ${playerSpriteHeight}.`,
        });
     }
  }

  const handleObjectHeightChange = (id: number, height: number) => {
    const spriteData: ObjectSpriteData = {
        ...(currentProject?.objectSpriteData?.[id] ?? { dataUrl: '' }),
        height: height
    };
    dispatch({ type: 'SET_OBJECT_SPRITE', payload: { id: id, spriteData } });
    toast({
        title: 'Object Sprite Height Updated',
        description: `The sprite height for object #${id} is now ${height}.`,
    });
  };

  const handleDeleteObjectSprite = (id: number) => {
    dispatch({ type: 'DELETE_OBJECT_SPRITE', payload: { id } });
    toast({
        title: 'Object Sprite Deleted',
        description: `Sprite for object #${id} has been removed.`,
    })
  }

  const handleDeleteAudioAsset = (fileName: string) => {
    dispatch({ type: 'DELETE_AUDIO_ASSET', payload: { fileName } });
    toast({
        title: 'Audio Asset Deleted',
        description: `${fileName} has been removed.`,
    })
  }


  const sortedObjectSpriteEntries = Object.entries(currentProject?.objectSpriteData ?? {})
    .map(([id, data]) => ({ id: parseInt(id), data }))
    .sort((a, b) => a.id - b.id);


  return (
    <div className="px-4 py-1 space-y-6">
        <SidebarGroup>
            <SidebarGroupLabel>Level Background</SidebarGroupLabel>
            <p className="text-xs text-muted-foreground pb-2">Upload a BMP for the current level background.</p>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".bmp"
                onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" onClick={handleBackgroundUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Background BMP
            </Button>
        </SidebarGroup>
        
        <Separator />

        <SidebarGroup>
            <SidebarGroupLabel>Textbox Background</SidebarGroupLabel>
            <p className="text-xs text-muted-foreground pb-2">Upload a BMP for the textbox (textbox.bmp).</p>
            {currentProject?.messageBoxBackground?.dataUrl && (
                <SpritePreview 
                    dataUrl={currentProject.messageBoxBackground.dataUrl}
                    height={160} // Assuming message box is full screen height
                />
            )}
            <input
                type="file"
                ref={messageBoxFileInputRef}
                className="hidden"
                accept=".bmp"
                onChange={handleMessageBoxFileChange}
            />
            <Button variant="outline" size="sm" onClick={handleMessageBoxUploadClick} className="mt-2">
                <MessageSquare className="mr-2 h-4 w-4" />
                Upload textbox.bmp
            </Button>
        </SidebarGroup>

        <Separator />

        <SidebarGroup>
            <SidebarGroupLabel>Battle Background</SidebarGroupLabel>
            <p className="text-xs text-muted-foreground pb-2">Upload a BMP for battles (battle_bg.bmp).</p>
            {currentProject?.battleBackground?.dataUrl && (
                <SpritePreview 
                    dataUrl={currentProject.battleBackground.dataUrl}
                    height={160}
                />
            )}
            <input
                type="file"
                ref={battleBgFileInputRef}
                className="hidden"
                accept=".bmp"
                onChange={handleBattleBgFileChange}
            />
            <Button variant="outline" size="sm" onClick={handleBattleBgUploadClick} className="mt-2">
                <Swords className="mr-2 h-4 w-4" />
                Upload battle_bg.bmp
            </Button>
        </SidebarGroup>

        <Separator />

        <SidebarGroup>
            <SidebarGroupLabel>Player Sprite</SidebarGroupLabel>
            <p className="text-xs text-muted-foreground pb-2">Upload a BMP for the player. It will be exported as player.bmp.</p>
            
            {currentProject?.playerSpriteData?.dataUrl && (
                <SpritePreview 
                    dataUrl={currentProject.playerSpriteData.dataUrl}
                    height={playerSpriteHeight}
                />
            )}

            <input
                type="file"
                ref={playerFileInputRef}
                className="hidden"
                accept=".bmp"
                onChange={handlePlayerFileChange}
            />
            <Button variant="outline" size="sm" onClick={handlePlayerSpriteUploadClick} className="mt-2">
                <Upload className="mr-2 h-4 w-4" />
                Upload Player BMP
            </Button>
             <div className="mt-4 space-y-2">
                <Label htmlFor="player-height">Sprite Height</Label>
                <Input
                    id="player-height"
                    type="number"
                    value={playerSpriteHeight}
                    onChange={(e) => setPlayerSpriteHeight(parseInt(e.target.value, 10))}
                    onBlur={handlePlayerHeightChange}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlayerHeightChange()}
                    className="h-8"
                />
            </div>
        </SidebarGroup>

        <Separator />

        <SidebarGroup>
            <SidebarGroupLabel>Object Sprites</SidebarGroupLabel>
             <p className="text-xs text-muted-foreground pb-2">Manage sprites for in-game objects.</p>

            <div className="space-y-4">
                {sortedObjectSpriteEntries.map(({ id, data }) => data && (
                    <div key={id} className="p-3 border rounded-lg bg-card/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Object ID: {id}</h4>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteObjectSprite(id)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                        
                        {data.dataUrl && <SpritePreview dataUrl={data.dataUrl} height={data.height} />}

                        <div className="space-y-2">
                            <Label htmlFor={`object-height-${id}`}>Sprite Height</Label>
                            <Input
                                id={`object-height-${id}`}
                                type="number"
                                value={data.height}
                                onChange={(e) => {
                                    const newHeight = parseInt(e.target.value, 10);
                                    dispatch({
                                        type: 'SET_OBJECT_SPRITE',
                                        payload: { id, spriteData: { ...data, height: newHeight } }
                                    });
                                }}
                                onBlur={(e) => handleObjectHeightChange(id, parseInt(e.target.value, 10))}
                                onKeyDown={(e) => e.key === 'Enter' && handleObjectHeightChange(id, parseInt(e.currentTarget.value, 10))}
                                className="h-8"
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            <Separator className="my-4"/>

            <div className="p-3 border rounded-lg space-y-3 border-dashed">
                <h4 className="font-semibold text-muted-foreground">Add New Object Sprite</h4>
                <div className="space-y-2">
                    <Label htmlFor="new-object-id">Object ID</Label>
                    <Input
                        id="new-object-id"
                        type="number"
                        value={newObjectId || ''}
                        onChange={(e) => setNewObjectId(parseInt(e.target.value, 10) || 1)}
                        className="h-8"
                        min="1"
                    />
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="new-object-height">Sprite Height</Label>
                    <Input
                        id="new-object-height"
                        type="number"
                        value={newObjectSpriteHeight}
                        onChange={(e) => setNewObjectSpriteHeight(parseInt(e.target.value, 10))}
                        className="h-8"
                        min="1"
                    />
                </div>

                <input
                    type="file"
                    ref={objectFileInputRef}
                    className="hidden"
                    accept=".bmp"
                    onChange={(e) => handleObjectFileChange(e, newObjectId)}
                />
                <Button variant="outline" size="sm" onClick={handleObjectSpriteUploadClick} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Object BMP
                </Button>
            </div>
        </SidebarGroup>

        <Separator />
        
        <SidebarGroup>
            <SidebarGroupLabel>Audio</SidebarGroupLabel>
            <p className="text-xs text-muted-foreground pb-2">Manage audio files (.xm) for music.</p>
             <div className="space-y-2">
                {currentProject?.audioAssets.map(audio => (
                    <div key={audio.fileName} className="flex items-center justify-between p-2 border rounded-md text-sm">
                        <span className="truncate">{audio.fileName}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAudioAsset(audio.fileName)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <input
                type="file"
                ref={audioFileInputRef}
                className="hidden"
                accept=".xm"
                onChange={handleAudioFileChange}
            />
            <Button variant="outline" size="sm" onClick={handleAudioUploadClick} className="mt-4 w-full">
                <Music className="mr-2 h-4 w-4" />
                Upload Audio File (.xm)
            </Button>
        </SidebarGroup>
    </div>
  );
}

    

    