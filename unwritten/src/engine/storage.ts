import { campaign } from './game';
import type { GameState } from './types';
export const AUTO_KEY = 'unwritten.autosave.v1';
export const SLOT_KEY = 'unwritten.slot.v1';
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= 100 && v.every((x) => typeof x === 'string' && x.length <= 100);
const actions = [
  'look',
  'inspect',
  'search',
  'take',
  'drop',
  'use',
  'eat',
  'drink',
  'go',
  'talk',
  'ask',
  'give',
  'climb',
  'wait',
  'help',
  'inventory',
  'journal',
  'stats',
  'save',
  'load',
  'attack',
  'unknown',
];
const validIntent = (v: unknown) =>
  isRecord(v) &&
  actions.includes(v.action as string) &&
  ['target', 'item', 'topic', 'raw'].every(
    (k) => typeof v[k] === 'string' && (v[k] as string).length <= 500,
  ) &&
  strings(v.modifiers);
export function validateSave(value: unknown): value is GameState {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !campaign.locations.some((l) => l.id === value.location) ||
    !['small', 'normal', 'tall'].includes(value.size as string)
  )
    return false;
  if (
    value.previousLocation !== undefined &&
    !campaign.locations.some((l) => l.id === value.previousLocation)
  )
    return false;
  if (
    !strings(value.inventory) ||
    !value.inventory.every((id) => campaign.entities.some((e) => e.id === id && e.portable)) ||
    new Set(value.inventory).size !== value.inventory.length ||
    !strings(value.flags) ||
    !strings(value.visited) ||
    !value.visited.every((id) => campaign.locations.some((l) => l.id === id))
  )
    return false;
  if (
    !Number.isSafeInteger(value.turn) ||
    (value.turn as number) < 0 ||
    !Number.isSafeInteger(value.seed) ||
    (value.seed as number) < 0 ||
    (value.seed as number) > 4294967295 ||
    typeof value.lastTarget !== 'string'
  )
    return false;
  if (
    !isRecord(value.stats) ||
    !['curiosity', 'resolve', 'agility'].every(
      (k) =>
        typeof value.stats === 'object' &&
        value.stats !== null &&
        Number.isFinite((value.stats as Record<string, unknown>)[k]) &&
        Number((value.stats as Record<string, unknown>)[k]) >= 0 &&
        Number((value.stats as Record<string, unknown>)[k]) <= 10,
    )
  )
    return false;
  if (
    !isRecord(value.itemLocations) ||
    !Object.entries(value.itemLocations).every(
      ([id, loc]) =>
        campaign.entities.some((e) => e.id === id && e.portable) &&
        typeof loc === 'string' &&
        ['inventory', 'consumed', ...campaign.locations.map((l) => l.id)].includes(loc),
    )
  )
    return false;
  if (
    !isRecord(value.trust) ||
    !Object.entries(value.trust).every(
      ([id, n]) =>
        campaign.entities.some((e) => e.id === id && e.kind === 'npc') &&
        typeof n === 'number' &&
        Number.isFinite(n) &&
        n >= -5 &&
        n <= 5,
    )
  )
    return false;
  if (
    !isRecord(value.memory) ||
    !Object.values(value.memory).every(strings) ||
    !isRecord(value.lastEvent) ||
    !Object.values(value.lastEvent).every((n) => Number.isSafeInteger(n) && Number(n) >= 0)
  )
    return false;
  if (
    !Array.isArray(value.entries) ||
    value.entries.length > 300 ||
    !value.entries.every(
      (e) =>
        isRecord(e) &&
        Number.isSafeInteger(e.id) &&
        Number.isSafeInteger(e.turn) &&
        ['story', 'command', 'system', 'dialogue'].includes(e.kind as string) &&
        typeof e.text === 'string' &&
        e.text.length <= 5000 &&
        (e.chapter === undefined || typeof e.chapter === 'string') &&
        (e.speaker === undefined || typeof e.speaker === 'string') &&
        (e.intent === undefined || validIntent(e.intent)),
    )
  )
    return false;
  return true;
}
export function serialize(s: GameState) {
  return JSON.stringify({
    format: 'unwritten-save',
    campaign: campaign.id,
    savedAt: new Date().toISOString(),
    state: s,
  });
}
export function deserialize(text: string): GameState {
  if (text.length > 2000000) throw new Error('This save file is too large.');
  const data: unknown = JSON.parse(text);
  if (
    !isRecord(data) ||
    data.format !== 'unwritten-save' ||
    data.campaign !== campaign.id ||
    !validateSave(data.state)
  )
    throw new Error(
      'This file is not a compatible Unwritten save. Your current game has been kept.',
    );
  return structuredClone(data.state);
}
export function readSave(key: string): GameState | null {
  const data = localStorage.getItem(key);
  return data ? deserialize(data) : null;
}
export function writeSave(key: string, state: GameState) {
  localStorage.setItem(key, serialize(state));
}
