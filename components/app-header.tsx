
'use client';

import React, { useRef, useState, useEffect } from 'react';
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  FolderOpen,
  Download,
  FilePlus,
  Settings,
  Save,
} from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";
import type { Project } from '@/lib/types';
import { generateGBAProject } from "@/lib/gba-exporter";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from './theme-switcher';
import { saveAs } from 'file-saver';


export function AppHeader() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProjectName, setNewProjectName] = useState("");
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isPlayerSettingsDialogOpen, setIsPlayerSettingsDialogOpen] = useState(false);
  const currentProject = state.projects.find(p => p.id === state.currentProjectId);
  const [playerSpeed, setPlayerSpeed] = useState('1');

  useEffect(() => {
    if (currentProject) {
        setPlayerSpeed(currentProject.playerSpeed.toString());
    }
  }, [currentProject]);

  const handleSaveProject = () => {
    if (!currentProject) {
      toast({
        title: 'Error',
        description: 'No project to save.',
        variant: 'destructive',
      });
      return;
    }

    const dataToSave = {
      ...currentProject,
    };

    const dataStr = "data:text/json;charset=utf-f," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${currentProject.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: 'Project Saved',
      description: 'Your project has been downloaded as a JSON file.',
    });
  };

  const handleOpenProjectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const projectData = JSON.parse(content) as Project;
          // Basic validation
          if (projectData.id && projectData.name && Array.isArray(projectData.levels)) {
            dispatch({ type: 'LOAD_PROJECT', payload: { project: projectData } });
            toast({
              title: 'Project Loaded',
              description: `Project "${projectData.name}" has been loaded successfully.`,
            });
          } else {
            throw new Error('Invalid project file format.');
          }
        } catch (error) {
          toast({
            title: 'Error Loading Project',
            description: 'The selected file is not a valid project JSON file.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow opening the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleNewProject = () => {
    if (newProjectName.trim()) {
      dispatch({ type: 'NEW_PROJECT', payload: { name: newProjectName.trim() } });
      toast({
        title: 'New Project Created',
        description: `Project "${newProjectName.trim()}" has been created.`,
      });
      setNewProjectName('');
      setIsNewProjectDialogOpen(false);
    }
  }

  const handleNewProjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewProject();
    }
  }

  const handleExport = async () => {
    if (!currentProject) {
        toast({
            title: "No Project",
            description: "Please create or load a project before exporting.",
            variant: "destructive"
        });
        return;
    }
    try {
      const zipBlob = await generateGBAProject(currentProject);
      saveAs(zipBlob, `${currentProject.name.replace(/\s+/g, '_').toLowerCase()}.zip`);
      toast({
        title: "Project Exported",
        description: "Your project has been successfully exported as a .zip file.",
      });
    } catch (error) {
      console.error("Error generating GBA project:", error);
      toast({
        title: "Export Error",
        description: "There was an error generating the GBA project.",
        variant: "destructive",
      });
    }
  };

  const handlePlayerSettingsSave = () => {
    if (currentProject) {
        dispatch({ type: 'SET_PLAYER_SPEED', payload: { speed: parseInt(playerSpeed, 10) } });
        setIsPlayerSettingsDialogOpen(false);
        toast({
            title: 'Player Settings Updated',
            description: `Player settings have been saved.`
        })
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <AlertDialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FilePlus className="mr-2 h-4 w-4" /> New
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Project</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a name for your new project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={handleNewProjectKeyDown}/>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleNewProject}>Create</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline" size="sm" onClick={handleOpenProjectClick}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Load
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />

        <Button variant="outline" size="sm" onClick={handleSaveProject}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>

        <Button onClick={handleExport} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Download className="mr-2 h-4 w-4" />Export .zip</Button>
      </div>

      <div className="flex items-center gap-2">
        <AlertDialog open={isPlayerSettingsDialogOpen} onOpenChange={setIsPlayerSettingsDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Player Settings</span>
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Player Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Player Settings</AlertDialogTitle>
              <AlertDialogDescription>
                Configure the player speed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Player Speed</Label>
                    <RadioGroup defaultValue="1" value={playerSpeed} onValueChange={setPlayerSpeed} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="speed-normal" />
                            <Label htmlFor="speed-normal">Normal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="speed-fast" />
                            <Label htmlFor="speed-fast">Fast</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePlayerSettingsSave}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
