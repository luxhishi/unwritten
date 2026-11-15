import content from '../content/wonderland.json';
import { hasMultipleActions, parseCommand } from './parser';
import { canonicalReference, resolveReference } from './references';
import type {
  Campaign,
  Condition,
  Effect,
  Entry,
  Entity,
  GameState,
  Intent,
  Passage,
} from './types';
export const campaign = content as Campaign;
export const locationOf = (s: GameState) => campaign.locations.find((l) => l.id === s.location)!;
export const entityById = (id: string) => campaign.entities.find((e) => e.id === id);
export const sizeLabel = (s: GameState) =>
  ({ small: 'Ten inches', normal: 'Ordinary', tall: 'Nine feet' })[s.size];
export function meets(s: GameState, conditions: Condition[] = []): boolean {
  return conditions.every(
    (c) =>
      (!c.any || c.any.some((option) => meets(s, [option]))) &&
      (!c.flag || s.flags.includes(c.flag)) &&
      (!c.notFlag || !s.flags.includes(c.notFlag)) &&
      (!c.hasItem || s.inventory.includes(c.hasItem)) &&
      (!c.size || s.size === c.size) &&
      (!c.location || s.location === c.location) &&
      (!c.trustAtLeast || (s.trust[c.trustAtLeast[0]] ?? 0) >= c.trustAtLeast[1]) &&
      (!c.trustBelow || (s.trust[c.trustBelow[0]] ?? 0) < c.trustBelow[1]),
  );
}
export function visibleEntities(s: GameState): Entity[] {
  return campaign.entities.filter(
    (e) =>
      meets(s, e.condition) &&
      (s.inventory.includes(e.id) || (s.itemLocations[e.id] ?? e.location) === s.location),
  );
}
function add(s: GameState, kind: Entry['kind'], text: string, extra: Partial<Entry> = {}) {
  s.entries.push({ id: (s.entries.at(-1)?.id ?? 0) + 1, kind, text, turn: s.turn, ...extra });
  s.entries = s.entries.slice(-300);
}
function passage(s: GameState, p: Passage, speaker?: string) {
  add(s, speaker ? 'dialogue' : 'story', p.text, {
    chapter: p.chapter,
    ...(speaker ? { speaker } : {}),
  });
}
function effect(s: GameState, e: Effect) {
  if (e.flag && !s.flags.includes(e.flag)) s.flags.push(e.flag);
  if (e.unsetFlag) s.flags = s.flags.filter((f) => f !== e.unsetFlag);
  if (e.addItem && !s.inventory.includes(e.addItem)) s.inventory.push(e.addItem);
  if (e.removeItem) {
    s.inventory = s.inventory.filter((id) => id !== e.removeItem);
    s.itemLocations[e.removeItem] = 'consumed';
  }
  if (e.size) s.size = e.size;
  if (e.trust)
    s.trust[e.trust[0]] = Math.max(-5, Math.min(5, (s.trust[e.trust[0]] ?? 0) + e.trust[1]));
  if (e.remember)
    s.memory[e.remember[0]] = [...new Set([...(s.memory[e.remember[0]] ?? []), e.remember[1]])];
}
export function newGame(): GameState {
  const s: GameState = {
    version: 1,
    location: 'hall',
    inventory: ['thimble', 'comfits'],
    itemLocations: {},
    flags: [],
    size: 'normal',
    turn: 0,
    seed: 73129,
    trust: { mouse: 0, rabbit: 0, dodo: 0 },
    memory: {},
    visited: ['hall'],
    entries: [],
    lastTarget: '',
    stats: { curiosity: 3, resolve: 2, agility: 2 },
    lastEvent: {},
  };
  passage(s, locationOf(s).description);
  passage(s, entityById('key')!.description);
  return s;
}
export function random(s: GameState): number {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function resolve(s: GameState, text: string, kind?: Entity['kind']): Entity | undefined {
  const result = resolveReference(text, visibleEntities(s), s.lastTarget, kind);
  return result.kind === 'found' ? result.entity : undefined;
}
function look(s: GameState) {
  passage(s, locationOf(s).description);
  const here = visibleEntities(s).filter((e) => !s.inventory.includes(e.id));
  if (here.length) add(s, 'system', `Here: ${here.map((e) => e.name).join(' · ')}.`);
  add(
    s,
    'system',
    `Exits: ${Object.entries(locationOf(s).exits)
      .map(
        ([dir, id]) =>
          `${dir} — ${campaign.locations.find((l) => l.id === id)!.name}${id === 'garden' && !s.flags.includes('doorUnlocked') ? ' (locked)' : ''}`,
      )
      .join(' · ')}.`,
  );
}
function move(s: GameState, intent: Intent): boolean {
  const n = canonicalReference(intent.target).replace(
    /^(?:the|back to|through the|through|into the|into) /,
    '',
  );
  const dirs: Record<string, string> = { n: 'north', s: 'south', e: 'east', w: 'west' };
  const exit = locationOf(s).exits;
  let destination: string | undefined = exit[dirs[n] ?? n];
  if (n === 'back') destination = s.previousLocation;
  if (!destination)
    destination = campaign.locations.find((l) =>
      l.aliases.some((a) => canonicalReference(a) === n),
    )?.id;
  if (/^(little |small |tiny |garden )?door$/.test(n) && s.location === 'hall')
    destination = 'garden';
  if (n === 'rabbit' || n === 'white rabbit')
    destination = s.location === 'hall' ? 'passage' : 'hall';
  if (!destination || !Object.values(exit).includes(destination)) {
    add(
      s,
      'system',
      'No reachable exit matched that destination. Type “look” to review the exits.',
    );
    return false;
  }
  const gate = campaign.gates.find(
    (g) => g.from === s.location && g.to === destination && !meets(s, g.conditions),
  );
  if (gate) {
    if (gate.passage) passage(s, gate.passage);
    add(s, 'system', gate.message);
    return false;
  }
  s.previousLocation = s.location;
  s.location = destination;
  if (!s.visited.includes(destination)) s.visited.push(destination);
  look(s);
  return true;
}
export function execute(state: GameState, raw: string): GameState {
  const s = structuredClone(state);
  if (!raw.trim()) return s;
  const intent = parseCommand(raw.trim().slice(0, 500));
  add(s, 'command', intent.raw, { intent });
  const { action } = intent;
  const system = (text: string) => add(s, 'system', text);
  if (hasMultipleActions(intent.raw)) {
    system('Describe one action at a time so each outcome can be resolved.');
    return s;
  }
  const readonly = ['help', 'inventory', 'journal', 'stats', 'save', 'load', 'look'];
  let success = false;
  if (action === 'unknown') {
    system(
      'That action isn’t supported in this chapter. Try describing one action with a verb and a target. Type “help” for parser guidance.',
    );
    return s;
  }
  if (action === 'help') {
    system(
      'Use your own words for one action at a time. The parser understands looking, examining, searching, taking, dropping, using, eating, drinking, moving, talking, asking, giving, climbing, and waiting. Mention a visible object or character. You can ask someone “about” a topic or use an item “on” an object. “Look” lists your surroundings and exits; “inventory”, “journal”, “save”, and “load” also work. Up and down arrows recall previous commands.',
    );
    return s;
  }
  if (action === 'inventory') {
    system(`Inventory: ${s.inventory.map((id) => entityById(id)!.name).join(', ') || 'empty'}.`);
    return s;
  }
  if (action === 'journal') {
    system(
      `Main objective: find a way into the garden. ${s.flags.includes('gardenReached') ? 'Complete.' : 'In progress.'} ${s.flags.includes('doorUnlocked') ? 'Little door: unlocked.' : 'Little door: locked.'} Current size: ${sizeLabel(s)}. Optional discoveries: ${s.flags.includes('mouseStory') ? 'Mouse’s history recorded.' : 'Mouse’s history not yet recorded.'} ${s.flags.includes('prizesGiven') ? 'Prizes shared.' : 'Prizes not yet shared.'}`,
    );
    return s;
  }
  if (action === 'stats') {
    system(
      `Alice · Curiosity ${s.stats.curiosity} · Resolve ${s.stats.resolve} · Agility ${s.stats.agility} · Size: ${sizeLabel(s)} · Turn ${s.turn}.`,
    );
    return s;
  }
  if (action === 'save' || action === 'load') {
    system('Use the save and load controls to manage the browser save slot.');
    return s;
  }
  if (action === 'look') {
    look(s);
    return s;
  }
  if (action === 'attack') {
    system('Combat is not available in this literary chapter. No world state changed.');
    return s;
  }
  if (action === 'go') success = move(s, intent);
  else if (action === 'wait') {
    system('One turn passed.');
    success = true;
  } else {
    const targetMatch = resolveReference(
      intent.target,
      visibleEntities(s),
      s.lastTarget,
      action === 'talk' || action === 'ask' || action === 'give' ? 'npc' : undefined,
    );
    const itemMatch = intent.item
      ? resolveReference(intent.item, visibleEntities(s), s.lastTarget, 'item')
      : undefined;
    const ambiguous = [targetMatch, itemMatch].find((match) => match?.kind === 'ambiguous');
    if (ambiguous?.kind === 'ambiguous') {
      system(
        `Which do you mean: ${ambiguous.entities.map((entity) => entity.name).join(' or ')}? Repeat the action with the specific name. Nothing has changed.`,
      );
      return s;
    }
    let target = targetMatch.kind === 'found' ? targetMatch.entity : undefined;
    if (!intent.target && !['inspect', 'search', 'drink', 'eat'].includes(action)) {
      system(
        `What would you like to ${action}? Include the name of a visible object or character.`,
      );
      return s;
    }
    if (action === 'drink' && !target && !intent.target) target = resolve(s, 'bottle');
    if (action === 'eat' && !target && !intent.target) target = resolve(s, 'cake');
    if (action === 'use' && target?.id === 'door') {
      if (intent.item && resolve(s, intent.item, 'item')?.id !== 'key') {
        system('Only a matching key can unlock this door.');
        return s;
      }
      if (s.inventory.includes('key')) target = entityById('key');
      else {
        system('The little door is locked. You need its key in your inventory.');
        return s;
      }
      system(
        `Interpreted as: use Golden key on ${targetMatch.kind === 'found' ? targetMatch.entity.name : 'Little door'}.`,
      );
    }
    if (action === 'use' && intent.item && target?.id !== 'key') {
      system('That item has no supported use on this target.');
      return s;
    }
    if (action === 'use' && target?.id === 'key' && s.location !== 'hall') {
      system('The little door is in the Hall of Doors.');
      return s;
    }
    if (
      (action === 'search' || action === 'inspect') &&
      (!intent.target || /^(?:the )?(room|surroundings|hall|hallway|area)$/.test(intent.target))
    ) {
      if (action === 'search' && s.location === 'hall') {
        const r = campaign.rules.find((r) => r.id === 'search-hall')!;
        r.effects?.forEach((e) => effect(s, e));
        passage(s, r.passage!);
        success = true;
      } else {
        look(s);
        success = true;
      }
    } else if (!target) {
      system(
        'No visible target matched that name. Use “look” to check your surroundings, or “inventory” to check what you carry.',
      );
    } else {
      s.lastTarget = target.id;
      if (action === 'take') {
        if (s.inventory.includes(target.id)) system(`${target.name} is already in your inventory.`);
        else if (!target.portable) system(`${target.name} cannot be taken.`);
        else if (
          s.size === 'small' &&
          s.location === 'hall' &&
          ['key', 'bottle'].includes(target.id) &&
          !s.itemLocations[target.id] &&
          !s.flags.includes('tableClimbed')
        ) {
          system('The tabletop is out of reach at your current size.');
        } else {
          s.inventory.push(target.id);
          s.itemLocations[target.id] = 'inventory';
          system(`${target.name} added to inventory.`);
          success = true;
        }
      } else if (action === 'drop') {
        if (!s.inventory.includes(target.id)) system(`${target.name} is not in your inventory.`);
        else {
          s.inventory = s.inventory.filter((id) => id !== target.id);
          s.itemLocations[target.id] = s.location;
          system(`${target.name} placed here.`);
          success = true;
        }
      } else if (action === 'climb' && target.id === 'table') {
        if (s.size !== 'small') system('You can already reach the tabletop.');
        else {
          const die = Math.floor(random(s) * 20) + 1;
          const result = die + s.stats.agility;
          system(
            `Agility check · d20 (${die}) + ${s.stats.agility} = ${result} · Difficulty 14 · ${result >= 14 ? 'Success. Tabletop within reach.' : 'Unsuccessful. You can try again, or change your size.'}`,
          );
          if (result >= 14) effect(s, { flag: 'tableClimbed' });
          success = true;
        }
      } else {
        const rule = campaign.rules.find(
          (r) =>
            r.actions.includes(action) &&
            r.target === target.id &&
            (!r.topic || new RegExp(r.topic).test(intent.topic)) &&
            meets(s, r.conditions),
        );
        if (
          action === 'give' &&
          !(
            target.id === 'dodo' &&
            itemMatch?.kind === 'found' &&
            itemMatch.entity.id === 'comfits'
          )
        )
          system('That gift has no supported outcome for this character.');
        else if (rule) {
          rule.effects?.forEach((e) => effect(s, e));
          if (rule.passage)
            passage(s, rule.passage, target.kind === 'npc' ? target.name : undefined);
          if (rule.message) system(rule.message);
          success = true;
        } else if (action === 'inspect' || action === 'search') {
          passage(s, target.description);
          success = true;
        } else if (
          ['use', 'eat', 'drink'].includes(action) &&
          target.portable &&
          !s.inventory.includes(target.id)
        )
          system(`Take ${target.name.toLowerCase()} before using it.`);
        else
          system(
            'That action has no available outcome for this target in the current world state.',
          );
      }
    }
  }
  for (const quest of campaign.quests)
    if (!s.flags.includes(quest.completedFlag) && meets(s, quest.completionConditions)) {
      s.flags.push(quest.completedFlag);
      system(
        `Chapter complete · ${quest.summary} You can continue exploring or begin again from Settings.`,
      );
    }
  if (success && !readonly.includes(action)) {
    s.turn++;
    if (s.turn % 5 === 0) {
      const events = campaign.events.filter(
        (e) => meets(s, e.conditions) && s.turn - (s.lastEvent[e.id] ?? -100) >= e.cooldown,
      );
      if (events.length) {
        let pick = random(s) * events.reduce((sum, e) => sum + e.weight, 0);
        const selected = events.find((e) => (pick -= e.weight) < 0) ?? events[0];
        s.lastEvent[selected.id] = s.turn;
        passage(s, selected.passage);
      }
    }
  }
  if (s.size !== 'small') s.flags = s.flags.filter((f) => f !== 'tableClimbed');
  return s;
}
export function note(state: GameState, text: string): GameState {
  const s = structuredClone(state);
  add(s, 'system', text);
  return s;
}
