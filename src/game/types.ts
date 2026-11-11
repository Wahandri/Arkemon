export type ElementType = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'flying';

export interface PokemonSpecies {
  id: string;
  name: string;
  speciesName: string;
  element: ElementType;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  workSkill: 'fire' | 'harvest' | 'water' | 'electric' | 'mining' | 'scout';
  workDescription: string;
  modelType: 'charmander' | 'bulbasaur' | 'squirtle' | 'pikachu' | 'geodude' | 'pidgey';
  scale: number;
  baseColor: number;
  accentColor: number;
  secondaryColor?: number;
}

export interface PokemonInstance {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  x: number;
  z: number;
  rotation: number;
  state: 'wild' | 'captured' | 'assigned_base';
  behavior: 'follow' | 'stay' | 'work' | 'aggressive';
  targetEntityId?: string | null;
  assignedJob?: 'campfire' | 'logging' | 'mining' | 'gathering' | null;
  attackCooldown?: number;
  isMounted?: boolean;
}

export type ItemType = 'resource' | 'tool' | 'weapon' | 'consumable' | 'sphere' | 'structure' | 'saddle';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  maxStack: number;
  harvestBonus?: {
    wood?: number;
    stone?: number;
    fiber?: number;
  };
  damage?: number;
  catchBonus?: number;
  healAmount?: number;
  hungerAmount?: number;
  structureType?: BuildingType;
}

export interface ItemStack {
  itemId: string;
  count: number;
}

export interface Recipe {
  id: string;
  resultItemId: string;
  resultCount: number;
  ingredients: { itemId: string; count: number }[];
  category: 'tools' | 'weapons' | 'survival' | 'spheres' | 'structures';
}

export type BuildingType = 'foundation' | 'wall' | 'campfire' | 'storage_chest' | 'pal_bed' | 'torch_post';

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  x: number;
  z: number;
  rotation: number;
  hp: number;
  maxHp: number;
  active?: boolean;
  assignedPalId?: string | null;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  hunger: number;
  maxHunger: number;
  torpor: number;
  maxTorpor: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface ResourceNode {
  id: string;
  type: 'tree' | 'rock' | 'bush' | 'boulder';
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  respawnTime?: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  z: number;
  amount: number;
  type: 'damage' | 'heal' | 'critical' | 'capture';
  life: number;
}

export interface NotificationMsg {
  id: string;
  text: string;
  icon?: string;
  timestamp: number;
}

export interface ElementalProjectile {
  id: string;
  element: ElementType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  fromPlayerOrCompanion: boolean;
  life: number;
  maxLife: number;
}

export interface BossInstance {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  x: number;
  z: number;
  rotation: number;
  state: 'idle' | 'chase' | 'attack_windup' | 'attack_release';
  attackTimer: number;
}

