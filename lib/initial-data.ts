
import type { Project, Level, CellData } from '@/lib/types';
import { CellType } from '@/lib/types';

const LEVEL_WIDTH = 15;
const LEVEL_HEIGHT = 10;

const createEmptyGrid = (width: number, height: number): CellData[][] => {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, (_, x) => ({
      type: CellType.Empty,
      tileId: null,
    }))
  );
};

const defaultLevel: Level = {
  id: 'level-1',
  name: 'First Zone',
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  grid: createEmptyGrid(LEVEL_WIDTH, LEVEL_HEIGHT),
  playerStart: { x: 2, y: 2 },
  backgroundImage: null,
  objectActions: {},
  triggerActions: {},
  onStartActions: [],
};

export const initialProject: Project = {
  id: 'project-1',
  name: 'My GBA Game',
  playerSprite: 'player',
  playerSpeed: 1,
  playerSpriteData: null,
  objectSpriteData: {},
  audioAssets: [],
  levels: [defaultLevel],
  messageBoxBackground: null,
  battleBackground: null,
  playerStats: {
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
  },
  monsters: [],
};

export const createNewLevel = (id: string, name: string): Level => ({
    id,
    name,
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    grid: createEmptyGrid(LEVEL_WIDTH, LEVEL_HEIGHT),
    playerStart: null,
    backgroundImage: null,
    objectActions: {},
    triggerActions: {},
    onStartActions: [],
});

export const createNewProject = (id: string, name: string): Project => {
    const newLevel = createNewLevel(`${id}-level-1`, 'First Zone');
    return {
        id,
        name,
        playerSprite: 'player',
        playerSpeed: 1,
        playerSpriteData: null,
        objectSpriteData: {},
        audioAssets: [],
        levels: [newLevel],
        messageBoxBackground: null,
        battleBackground: null,
        playerStats: {
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
        },
        monsters: [],
    };
};

    
