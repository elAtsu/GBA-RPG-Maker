
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Project, Level, EditMode, CellData, ObjectAction, SelectedObject, SelectedTrigger, BackgroundImage, LevelTransitionTarget, PlayerSpriteData, ObjectSpriteData, AudioAsset, PlayerStats, Monster } from '@/lib/types';
import { initialProject, createNewLevel, createNewProject } from '@/lib/initial-data';
import { produce } from 'immer';

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentLevelId: string | null;
  editMode: EditMode;
  brushActive: boolean;
  selectedTileId: number | null;
  currentTriggerId: number;
  currentObjectId: number;
  selectedObject: SelectedObject | null;
  selectedTrigger: SelectedTrigger | null;
  levelTransitionTarget: LevelTransitionTarget | null;
}

type Action =
  | { type: 'NEW_PROJECT'; payload: { name: string } }
  | { type: 'LOAD_PROJECT'; payload: { project: Project } }
  | { type: 'ADD_LEVEL'; payload: { name: string } }
  | { type: 'SELECT_LEVEL'; payload: { levelId: string } }
  | { type: 'SET_EDIT_MODE'; payload: { mode: EditMode } }
  | { type: 'TOGGLE_BRUSH' }
  | { type: 'UPDATE_LEVEL_DATA'; payload: { levelId: string; grid: CellData[][]; playerStart: { x: number; y: number } | null } }
  | { type: 'UPDATE_LEVEL_NAME'; payload: { levelId: string; name: string } }
  | { type: 'SELECT_TILE'; payload: { tileId: number | null } }
  | { type: 'SET_TRIGGER_ID'; payload: { triggerId: number } }
  | { type: 'SET_OBJECT_ID'; payload: { objectId: number } }
  | { type: 'SET_BACKGROUND_IMAGE'; payload: { backgroundImage: BackgroundImage | null } }
  | { type: 'SET_PLAYER_SPRITE'; payload: { spriteData: PlayerSpriteData | null } }
  | { type: 'SET_OBJECT_SPRITE'; payload: { id: number, spriteData: ObjectSpriteData | null } }
  | { type: 'DELETE_OBJECT_SPRITE', payload: { id: number } }
  | { type: 'SET_PLAYER_SPEED', payload: { speed: number } }
  | { type: 'ADD_AUDIO_ASSET', payload: { audioAsset: AudioAsset } }
  | { type: 'DELETE_AUDIO_ASSET', payload: { fileName: string } }
  | { type: 'SELECT_OBJECT', payload: SelectedObject | null }
  | { type: 'SELECT_TRIGGER', payload: SelectedTrigger | null }
  | { type: 'UPDATE_OBJECT_ACTION', payload: { levelId: string; objectId: number; actions: ObjectAction[] } }
  | { type: 'UPDATE_TRIGGER_ACTION', payload: { levelId: string; triggerId: number; actions: ObjectAction[] } }
  | { type: 'UPDATE_LEVEL_ON_START_ACTIONS', payload: { levelId: string; actions: ObjectAction[] } }
  | { type: 'SET_LEVEL_TRANSITION_TARGET', payload: LevelTransitionTarget | null }
  | { type: 'SET_MESSAGE_BOX_BACKGROUND', payload: { backgroundImage: BackgroundImage | null } }
  | { type: 'SET_BATTLE_BACKGROUND', payload: { backgroundImage: BackgroundImage | null } }
  | { type: 'UPDATE_PLAYER_STATS', payload: { stats: PlayerStats } }
  | { type: 'ADD_MONSTER', payload: { monster: Monster } }
  | { type: 'UPDATE_MONSTER', payload: { monster: Monster } }
  | { type: 'DELETE_MONSTER', payload: { id: number } };


const initialState: AppState = {
  projects: [initialProject],
  currentProjectId: initialProject.id,
  currentLevelId: initialProject.levels[0]?.id ?? null,
  editMode: 'player',
  brushActive: true,
  selectedTileId: 0,
  currentTriggerId: 1,
  currentObjectId: 1,
  selectedObject: null,
  selectedTrigger: null,
  levelTransitionTarget: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'NEW_PROJECT': {
      const newProjectId = `project-${Date.now()}`;
      const newProject = createNewProject(newProjectId, action.payload.name);
      return {
        ...initialState,
        projects: [newProject],
        currentProjectId: newProject.id,
        currentLevelId: newProject.levels[0]?.id ?? null,
      };
    }
    case 'LOAD_PROJECT': {
        const newProject = action.payload.project;
        return {
            ...initialState,
            projects: [newProject],
            currentProjectId: newProject.id,
            currentLevelId: newProject.levels[0]?.id ?? null,
        }
    }
    case 'ADD_LEVEL': {
      if (!state.currentProjectId) return state;
      const newLevelId = `level-${Date.now()}`;
      const newLevel = createNewLevel(newLevelId, action.payload.name);
      const updatedProjects = state.projects.map(p =>
        p.id === state.currentProjectId
          ? { ...p, levels: [...p.levels, newLevel] }
          : p
      );
      return {
        ...state,
        projects: updatedProjects,
        currentLevelId: newLevelId,
      };
    }
    case 'SELECT_LEVEL':
      return {
        ...state,
        currentLevelId: action.payload.levelId,
        selectedObject: null, 
        selectedTrigger: null,
      };
    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: action.payload.mode,
        selectedObject: action.payload.mode !== 'select' ? null : state.selectedObject,
        selectedTrigger: action.payload.mode !== 'select' ? null : state.selectedTrigger,
      };
    case 'TOGGLE_BRUSH':
      return {
        ...state,
        brushActive: !state.brushActive,
      };
    case 'UPDATE_LEVEL_DATA': {
      if (!state.currentProjectId) return state;
      const { levelId, grid, playerStart } = action.payload;
      const updatedProjects = state.projects.map(p => {
        if (p.id === state.currentProjectId) {
          return {
            ...p,
            levels: p.levels.map(l =>
              l.id === levelId
                ? { ...l, grid, playerStart }
                : l
            ),
          };
        }
        return p;
      });
      return { ...state, projects: updatedProjects };
    }
    case 'UPDATE_LEVEL_NAME': {
        if (!state.currentProjectId) return state;
        const { levelId, name } = action.payload;
        const updatedProjects = state.projects.map(p => {
          if (p.id === state.currentProjectId) {
            return {
              ...p,
              levels: p.levels.map(l =>
                l.id === levelId
                  ? { ...l, name }
                  : l
              ),
            };
          }
          return p;
        });
        return { ...state, projects: updatedProjects };
      }
    case 'SELECT_TILE':
        return {
            ...state,
            selectedTileId: action.payload.tileId,
        };
    case 'SET_TRIGGER_ID':
        return {
            ...state,
            currentTriggerId: action.payload.triggerId,
        };
    case 'SET_OBJECT_ID':
        return {
            ...state,
            currentObjectId: action.payload.objectId,
        };
    case 'SET_BACKGROUND_IMAGE': {
        if (!state.currentProjectId || !state.currentLevelId) return state;
        const updatedProjects = state.projects.map(p => {
            if (p.id === state.currentProjectId) {
                return {
                    ...p,
                    levels: p.levels.map(l =>
                        l.id === state.currentLevelId
                            ? { ...l, backgroundImage: action.payload.backgroundImage }
                            : l
                    ),
                };
            }
            return p;
        });
        return { ...state, projects: updatedProjects };
    }
     case 'SET_PLAYER_SPRITE': {
        if (!state.currentProjectId) return state;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                project.playerSpriteData = action.payload.spriteData;
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'SET_OBJECT_SPRITE': {
      if (!state.currentProjectId) return state;
       const { id, spriteData } = action.payload;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                if (!project.objectSpriteData) {
                    project.objectSpriteData = {};
                }
                project.objectSpriteData[id] = spriteData;
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'DELETE_OBJECT_SPRITE': {
      if (!state.currentProjectId) return state;
      const { id } = action.payload;
      const updatedProjects = produce(state.projects, draft => {
          const project = draft.find(p => p.id === state.currentProjectId);
          if (project && project.objectSpriteData) {
              delete project.objectSpriteData[id];
          }
      });
      return { ...state, projects: updatedProjects };
    }
    case 'SET_PLAYER_SPEED': {
        if (!state.currentProjectId) return state;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                project.playerSpeed = action.payload.speed;
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'ADD_AUDIO_ASSET': {
        if (!state.currentProjectId) return state;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                if (!project.audioAssets.some(a => a.fileName === action.payload.audioAsset.fileName)) {
                    project.audioAssets.push(action.payload.audioAsset);
                }
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'DELETE_AUDIO_ASSET': {
        if (!state.currentProjectId) return state;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                project.audioAssets = project.audioAssets.filter(a => a.fileName !== action.payload.fileName);
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'SELECT_OBJECT':
        return {
            ...state,
            selectedObject: action.payload,
            selectedTrigger: null,
            levelTransitionTarget: null,
        };
    case 'SELECT_TRIGGER':
        return {
            ...state,
            selectedTrigger: action.payload,
            selectedObject: null,
            levelTransitionTarget: null,
        };
    case 'UPDATE_OBJECT_ACTION': {
        if (!state.currentProjectId) return state;
        const { levelId, objectId, actions } = action.payload;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                const level = project.levels.find(l => l.id === levelId);
                if (level) {
                    if (!level.objectActions) {
                        level.objectActions = {};
                    }
                    level.objectActions[objectId] = actions;
                }
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'UPDATE_TRIGGER_ACTION': {
      if (!state.currentProjectId) return state;
      const { levelId, triggerId, actions } = action.payload;
      const updatedProjects = produce(state.projects, draft => {
          const project = draft.find(p => p.id === state.currentProjectId);
          if (project) {
              const level = project.levels.find(l => l.id === levelId);
              if (level) {
                  if (!level.triggerActions) {
                      level.triggerActions = {};
                  }
                  level.triggerActions[triggerId] = actions;
              }
          }
      });
      return { ...state, projects: updatedProjects };
    }
    case 'UPDATE_LEVEL_ON_START_ACTIONS': {
        if (!state.currentProjectId) return state;
        const { levelId, actions } = action.payload;
        const updatedProjects = produce(state.projects, draft => {
            const project = draft.find(p => p.id === state.currentProjectId);
            if (project) {
                const level = project.levels.find(l => l.id === levelId);
                if (level) {
                    level.onStartActions = actions;
                }
            }
        });
        return { ...state, projects: updatedProjects };
    }
    case 'SET_LEVEL_TRANSITION_TARGET':
      return {
        ...state,
        levelTransitionTarget: action.payload,
      };
    case 'SET_MESSAGE_BOX_BACKGROUND': {
      if (!state.currentProjectId) return state;
      const updatedProjects = produce(state.projects, draft => {
          const project = draft.find(p => p.id === state.currentProjectId);
          if (project) {
              project.messageBoxBackground = action.payload.backgroundImage;
          }
      });
      return { ...state, projects: updatedProjects };
    }
    case 'SET_BATTLE_BACKGROUND': {
      if (!state.currentProjectId) return state;
      return produce(state, draft => {
          const project = draft.projects.find(p => p.id === draft.currentProjectId);
          if (project) {
              project.battleBackground = action.payload.backgroundImage;
          }
      });
    }
    case 'UPDATE_PLAYER_STATS': {
      if (!state.currentProjectId) return state;
      return produce(state, draft => {
        const project = draft.projects.find(p => p.id === draft.currentProjectId);
        if (project) {
          project.playerStats = action.payload.stats;
        }
      });
    }
    case 'ADD_MONSTER': {
      if (!state.currentProjectId) return state;
      return produce(state, draft => {
        const project = draft.projects.find(p => p.id === draft.currentProjectId);
        if (project) {
          if (!project.monsters) {
            project.monsters = [];
          }
          project.monsters.push(action.payload.monster);
        }
      });
    }
    case 'UPDATE_MONSTER': {
      if (!state.currentProjectId) return state;
      return produce(state, draft => {
        const project = draft.projects.find(p => p.id === draft.currentProjectId);
        if (project) {
          const index = project.monsters.findIndex(m => m.id === action.payload.monster.id);
          if (index !== -1) {
            project.monsters[index] = action.payload.monster;
          }
        }
      });
    }
    case 'DELETE_MONSTER': {
      if (!state.currentProjectId) return state;
      return produce(state, draft => {
        const project = draft.projects.find(p => p.id === draft.currentProjectId);
        if (project) {
          project.monsters = project.monsters.filter(m => m.id !== action.payload.id);
        }
      });
    }
    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
