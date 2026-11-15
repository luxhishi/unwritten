export type Action =
  | 'look'
  | 'inspect'
  | 'search'
  | 'take'
  | 'drop'
  | 'use'
  | 'eat'
  | 'drink'
  | 'go'
  | 'talk'
  | 'ask'
  | 'give'
  | 'climb'
  | 'wait'
  | 'help'
  | 'inventory'
  | 'journal'
  | 'stats'
  | 'save'
  | 'load'
  | 'attack'
  | 'unknown';
export type Size = 'small' | 'normal' | 'tall';
export interface Intent {
  action: Action;
  target: string;
  item: string;
  topic: string;
  modifiers: string[];
  raw: string;
}
export interface Condition {
  flag?: string;
  notFlag?: string;
  hasItem?: string;
  size?: Size;
  trustAtLeast?: [string, number];
  trustBelow?: [string, number];
  location?: string;
  any?: Condition[];
}
export interface Effect {
  flag?: string;
  unsetFlag?: string;
  addItem?: string;
  removeItem?: string;
  size?: Size;
  trust?: [string, number];
  remember?: [string, string];
}
export interface Passage {
  text: string;
  chapter: string;
}
export interface Entity {
  id: string;
  name: string;
  aliases: string[];
  description: Passage;
  location?: string;
  condition?: Condition[];
  kind: 'item' | 'feature' | 'npc';
  icon?: string;
  portable?: boolean;
}
export interface Location {
  id: string;
  name: string;
  subtitle: string;
  description: Passage;
  exits: Record<string, string>;
  aliases: string[];
}
export interface Rule {
  id: string;
  actions: Action[];
  target: string;
  topic?: string;
  conditions?: Condition[];
  effects?: Effect[];
  passage?: Passage;
  message?: string;
}
export interface Entry {
  id: number;
  kind: 'story' | 'command' | 'system' | 'dialogue';
  text: string;
  chapter?: string;
  speaker?: string;
  intent?: Intent;
  turn: number;
}
export interface GameState {
  version: 1;
  location: string;
  previousLocation?: string;
  inventory: string[];
  itemLocations: Record<string, string>;
  flags: string[];
  size: Size;
  turn: number;
  seed: number;
  trust: Record<string, number>;
  memory: Record<string, string[]>;
  visited: string[];
  entries: Entry[];
  lastTarget: string;
  stats: { curiosity: number; resolve: number; agility: number };
  lastEvent: Record<string, number>;
}
export interface Quest {
  id: string;
  title: string;
  summary: string;
  completedFlag: string;
  completionConditions: Condition[];
  steps: { label: string; conditions: Condition[] }[];
}
export interface Campaign {
  id: string;
  title: string;
  author: string;
  source: string;
  locations: Location[];
  entities: Entity[];
  rules: Rule[];
  quests: Quest[];
  gates: {
    from: string;
    to: string;
    conditions: Condition[];
    message: string;
    passage?: Passage;
  }[];
  events: {
    id: string;
    weight: number;
    cooldown: number;
    conditions: Condition[];
    passage: Passage;
  }[];
}
