

export enum CellType {
  Empty = 0,
  Solid = 1,
  Trigger = 2,
  Object = 3,
  Select = 4, // Not a real cell type, just for edit mode
}

export enum MapType {
    Menu = 'menu',
    Map = 'map',
    Battle = 'battle',
}

export type CellData = {
  type: CellType;
  tileId: number | null;
  triggerId?: number;
  objectId?: number;
};

export type ObjectActionType = 'message' | 'changeLevel' | 'stopMusic' | 'playMusic' | 'showHideObject' | 'miniMenu' | 'showHidePlayer' | 'startBattle' | 'restoreHealth' | 'restoreMana';

export type MiniMenuAction = {
    text: string;
    actions: ObjectAction[];
}

export type ChangeLevelValue = {
  levelId: string;
  x: number;
  y: number;
  useDefaultStart: boolean;
}

export type ObjectAction = {
    type: ObjectActionType;
    value: string | number | { id: number, state: 'show' | 'hide' } | { options: MiniMenuAction[] } | ChangeLevelValue | any;
};

export type BackgroundImage = {
  dataUrl: string;
  fileName: string;
}

export type PlayerSpriteData = {
    dataUrl: string;
    height: number;
}

export type ObjectSpriteData = {
    dataUrl: string;
    height: number;
}

export type AudioAsset = {
    dataUrl: string;
    fileName: string;
}

export type PlayerStats = {
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  magicAttack: number;
  speed: number;
  exp: number;
  expToNextLevel: number;
  potions: number;
  smokeBombs: number;
}

export type MonsterSpriteData = {
  dataUrl: string;
  fileName: string;
}

export type Monster = {
  id: number;
  name: string;
  level: number;
  health: number;
  attack: number;
  speed: number;
  sprite: MonsterSpriteData | null;
}

export type MonsterSpawn = {
  monsterId: number;
  chance: number; // Percentage
};


export type Level = {
  id: string;
  name: string;
  grid: CellData[][];
  width: number;
  height: number;
  playerStart: { x: number; y: number } | null;
  backgroundImage: BackgroundImage | null;
  objectActions: Record<number, ObjectAction[]>;
  triggerActions: Record<number, ObjectAction[]>;
  onStartActions: ObjectAction[];
};

export type Project = {
  id: string;
  name: string;
  playerSprite: string;
  playerSpeed: number;
  playerSpriteData: PlayerSpriteData | null;
  objectSpriteData: Record<number, ObjectSpriteData | null>;
  audioAssets: AudioAsset[];
  levels: Level[];
  messageBoxBackground: BackgroundImage | null;
  battleBackground: BackgroundImage | null;
  playerStats: PlayerStats;
  monsters: Monster[];
};

export type EditMode = 'assets' | 'collision' | 'player' | 'object' | 'trigger' | 'select' | 'background' | 'combat';

export type SelectedObject = {
  levelId: string;
  objectId: number;
}

export type SelectedTrigger = {
  levelId: string;
  triggerId: number;
}

export type LevelTransitionTarget = {
  levelId: string;
  x: number;
  y: number;
}

    
