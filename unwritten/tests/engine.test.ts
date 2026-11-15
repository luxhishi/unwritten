import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaign, execute, meets, newGame, visibleEntities } from '../src/engine/game';
import { parseCommand } from '../src/engine/parser';
import { deserialize, serialize, validateSave } from '../src/engine/storage';
const run = (...commands: string[]) => commands.reduce(execute, newGame());
test('parser extracts synonyms, method, topic, direction, and modifiers', () => {
  assert.equal(parseCommand('Please pick up the golden key').action, 'take');
  assert.equal(parseCommand('I want to examine the little door').action, 'inspect');
  assert.deepEqual(
    { ...parseCommand('use key on door'), raw: '' },
    { action: 'use', target: 'door', item: 'key', topic: '', modifiers: [], raw: '' },
  );
  assert.equal(parseCommand('ask the mouse about cats').topic, 'cats');
  assert.equal(parseCommand('stab wolf with my dagger').item, 'my dagger');
  assert.deepEqual(parseCommand('sneak quietly north').modifiers, ['quietly']);
  assert.equal(parseCommand('north').action, 'go');
  assert.equal(parseCommand('?').action, 'help');
});
test('the primary quest is playable from start to completion', () => {
  const s = run(
    'take the golden key',
    'use key on door',
    'take bottle',
    'drink the bottle',
    'go south',
  );
  assert.equal(s.location, 'garden');
  assert.ok(s.flags.includes('gardenReached'));
  assert.equal(s.size, 'small');
  assert.equal(s.turn, 5);
});
test('an alternative solution uses the Rabbit’s fan', () => {
  const s = run(
    'collect key',
    'open the little door',
    'travel north',
    'talk to the White Rabbit',
    'take fan',
    'use fan',
    'go south',
    'enter the garden',
  );
  assert.equal(s.location, 'garden');
  assert.ok(s.flags.includes('rabbitMet'));
});
test('shrinking before collecting the key can be recovered with cake', () => {
  let s = run('take bottle', 'drink bottle', 'take key');
  assert.ok(!s.inventory.includes('key'));
  s = [
    'search the room',
    'take cake',
    'eat cake',
    'take key',
    'unlock door with key',
    'north',
    'talk to rabbit',
    'take fan',
    'use fan',
    'south',
    'south',
  ].reduce(execute, s);
  assert.equal(s.location, 'garden');
  assert.ok(s.flags.includes('gardenReached'));
});
test('locked doors, player size, and adjacent movement are enforced', () => {
  assert.equal(run('go south').location, 'hall');
  assert.equal(run('take key', 'open door', 'go south').location, 'hall');
  assert.equal(run('travel to pool', 'go garden').location, 'pool');
  assert.equal(run('west', 'east', 'north', 'south', 'east', 'west').location, 'hall');
});
test('contextual entity resolution rejects distant characters and objects', () => {
  const s = run('take fan', 'ask mouse about history');
  assert.equal(s.turn, 0);
  assert.equal(s.memory.mouse, undefined);
  assert.equal(s.inventory.includes('fan'), false);
  assert.ok(!visibleEntities(newGame()).some((e) => e.id === 'cake'));
  assert.ok(visibleEntities(run('search room')).some((e) => e.id === 'cake'));
});
test('pronouns refer to the previously resolved target', () => {
  assert.ok(run('inspect key', 'take it').inventory.includes('key'));
});
test('invalid methods and unsupported gifts do not alter puzzle state', () => {
  assert.ok(!run('take key', 'take bottle', 'use bottle on door').flags.includes('doorUnlocked'));
  assert.ok(!run('take key', 'use key on bottle').flags.includes('doorUnlocked'));
  assert.ok(!run('east', 'give thimble to dodo').flags.includes('prizesGiven'));
  assert.ok(run('east', 'give comfits to dodo').flags.includes('prizesGiven'));
});
test('NPCs remember insults and apologies across save roundtrips', () => {
  let s = run('east', 'ask mouse about cats');
  assert.equal(s.trust.mouse, -2);
  s = execute(s, 'ask mouse about cats');
  assert.equal(s.trust.mouse, -2);
  s = deserialize(serialize(s));
  s = execute(s, 'apologize to mouse');
  assert.equal(s.trust.mouse, 0);
  assert.ok(!s.flags.includes('mouseOffended'));
  s = execute(s, 'ask mouse about history');
  assert.ok(s.flags.includes('mouseStory'));
  assert.ok(s.memory.mouse.includes('apology'));
});
test('unsupported commands and read-only queries do not advance time', () => {
  const s = run('fly to the moon', 'look', 'inventory', 'journal', 'stats', 'attack rabbit');
  assert.equal(s.turn, 0);
  assert.equal(s.location, 'hall');
});
test('seeded dice and event selection reproduce exactly', () => {
  const commands = [
    'take bottle',
    'drink bottle',
    'climb table',
    'climb table',
    'climb table',
    'wait',
    'wait',
  ];
  assert.deepEqual(run(...commands), run(...commands));
  const s = run('wait', 'wait', 'wait', 'wait', 'wait');
  assert.equal(s.lastEvent['hall-thought'], 5);
  const later = ['wait', 'wait', 'wait', 'wait', 'wait'].reduce(execute, s);
  assert.equal(later.lastEvent['hall-thought'], 5);
});
test('dropping and recovering items works and consumed items stay consumed', () => {
  let s = run('take key', 'drop key', 'take bottle', 'drink bottle', 'take key');
  assert.ok(s.inventory.includes('key'));
  s = execute(s, 'take bottle');
  assert.ok(!s.inventory.includes('bottle'));
  assert.equal(s.itemLocations.bottle, 'consumed');
});
test('condition evaluator composes inventory, flags, trust, size, and location', () => {
  const s = run('take key');
  assert.ok(
    meets(s, [
      {
        hasItem: 'key',
        location: 'hall',
        size: 'normal',
        notFlag: 'gardenReached',
        trustAtLeast: ['mouse', 0],
      },
    ]),
  );
  assert.ok(!meets(s, [{ flag: 'gardenReached' }]));
});
test('save roundtrips preserve all state and reject invalid formats', () => {
  const s = run('take key', 'north', 'talk to rabbit');
  assert.deepEqual(deserialize(serialize(s)), s);
  assert.throws(() => deserialize('{'));
  assert.throws(() =>
    deserialize(JSON.stringify({ format: 'unwritten-save', campaign: 'other', state: s })),
  );
  for (const patch of [
    { location: 'nowhere' },
    { size: 'giant' },
    { inventory: ['made-up'] },
    { entries: [{ kind: 'story', text: { unsafe: true } }] },
    { stats: { agility: Infinity } },
    { turn: -1 },
    { memory: { mouse: 7 } },
  ])
    assert.equal(validateSave({ ...s, ...patch }), false);
});
test('every campaign narrative passage has a source chapter', () => {
  for (const l of campaign.locations) assert.ok(l.description.chapter);
  for (const e of campaign.entities) assert.ok(e.description.chapter);
  for (const r of campaign.rules) if (r.passage) assert.ok(r.passage.chapter);
  assert.ok(
    campaign.rules.every((r) => !r.conditions?.some((c) => c.flag && c.notFlag === c.flag)),
  );
});
test('movement modifiers, backtracking, and compound command fallback', () => {
  assert.equal(run('go quietly north').location, 'passage');
  assert.equal(run('north', 'back', 'back').location, 'passage');
  const s = run('take key and drink bottle');
  assert.equal(s.turn, 0);
  assert.ok(!s.inventory.includes('key'));
  assert.ok(!s.inventory.includes('bottle'));
});
test('opening the glass box uses a content rule and preserves consumable state', () => {
  const s = run('open glass box', 'take cake', 'eat cake', 'search table');
  assert.ok(s.flags.includes('cakeUsed'));
  assert.ok(!visibleEntities(s).some((e) => e.id === 'cake'));
});
test('save validation rejects malicious structured transcript values', () => {
  const s = newGame();
  s.entries.push({
    id: 3,
    turn: 0,
    kind: 'command',
    text: 'look',
    intent: { action: {} as never, target: '', item: '', topic: '', modifiers: [], raw: 'look' },
  });
  assert.equal(validateSave(s), false);
});
