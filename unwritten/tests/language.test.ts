import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaign, entityById, execute, newGame } from '../src/engine/game';
import { hasMultipleActions, parseCommand } from '../src/engine/parser';
import { canonicalReference, resolveReference } from '../src/engine/references';
import { deserialize, serialize } from '../src/engine/storage';
const run = (...commands: string[]) => commands.reduce(execute, newGame());
const lastMessage = (s: ReturnType<typeof newGame>) => s.entries.at(-1)?.text ?? '';

test('natural-language tool frames all reach the existing authored door outcome', () => {
  for (const command of [
    'I try the key on one of the doors',
    'Could I carefully try my golden key on the little door?',
    'I would like to use the key to unlock the door',
    'I try to unlock the door with the key',
    'I insert the golden key into the lock',
    'I turn my key in the lock',
    'Please attempt the key on one of those doors',
    'I’ll gently try the key on the door',
  ]) {
    const s = run('take key', command);
    assert.ok(s.flags.includes('doorUnlocked'), command);
    assert.equal(s.turn, 2, command);
    assert.ok(
      s.entries.some((entry) => entry.text === 'Interpreted as: use Golden key on Little door.'),
      command,
    );
    assert.ok(
      s.entries.some(
        (entry) => entry.chapter && entry.text.includes('to her great delight it fitted'),
      ),
      command,
    );
  }
});

test('sentence wrappers and separated phrasal verbs keep supported actions intact', () => {
  for (const command of [
    'I pick the golden key up',
    'May I pick the key up from the glass table?',
    'I want to try to pick up the key',
    'I put the golden key into my pocket',
    'Please stash my key in the satchel',
    'I take the key off the table',
    'I would like to collect the key please',
  ])
    assert.ok(run(command).inventory.includes('key'), command);
  assert.equal(run('I would like to go towards the north').location, 'passage');
});

test('the reported pocket-pronoun sequence works without repeating the object', () => {
  const s = run('I check the little bottle', 'I put it in my pocket');
  assert.ok(s.inventory.includes('bottle'));
  assert.equal(s.turn, 2);
});

test('reference resolution handles articles, possessives, plurals, and contextual pronouns', () => {
  assert.equal(canonicalReference('one of those doors'), 'door');
  assert.equal(canonicalReference('the glass boxes'), 'glass box');
  const key = entityById('key')!;
  assert.deepEqual(resolveReference('my golden keys', [key], ''), { kind: 'found', entity: key });
  assert.equal(resolveReference('it', [key], 'key').kind, 'found');
  assert.equal(resolveReference('it', [], 'key').kind, 'missing');
  assert.equal(resolveReference('imaginary rusty key', [key], '').kind, 'missing');
  assert.equal(run('take an imaginary rusty key').inventory.includes('key'), false);
});

test('ambiguous visible targets request clarification without choosing a target or advancing time', () => {
  const door = entityById('door')!;
  const other = {
    ...door,
    id: 'test-cellar-door',
    name: 'Cellar door',
    aliases: ['door', 'cellar door'],
  };
  const reference = resolveReference('one of the doors', [door, other], '');
  assert.equal(reference.kind, 'ambiguous');
  assert.equal(resolveReference('little door', [door, other], '').kind, 'found');
  campaign.entities.push(other);
  try {
    const before = run('take key');
    const after = execute(before, 'I try the key on one of the doors');
    assert.match(lastMessage(after), /Which do you mean: Little door or Cellar door/);
    assert.deepEqual(after.flags, before.flags);
    assert.deepEqual(after.inventory, before.inventory);
    assert.equal(after.seed, before.seed);
    assert.equal(after.turn, before.turn);
    assert.equal(after.lastTarget, before.lastTarget);
  } finally {
    campaign.entities.pop();
  }
});

test('natural wording still respects possession, location, and valid item-target combinations', () => {
  assert.ok(!run('I try the key on one of the doors').flags.includes('doorUnlocked'));
  assert.ok(
    !run('take key', 'take bottle', 'I try the bottle on the door').flags.includes('doorUnlocked'),
  );
  assert.ok(!run('take key', 'I try the key on the bottle').flags.includes('doorUnlocked'));
  assert.ok(!run('take key', 'north', 'I try the key on the door').flags.includes('doorUnlocked'));
  assert.equal(run('I put the fan in my pocket').inventory.includes('fan'), false);
});

test('negated and multiple-action sentences cannot accidentally execute an action', () => {
  for (const command of [
    'I do not take the key',
    'I don’t want to take the key',
    'I take the key without using it',
    'I take the key and then I try it on the door',
    'take key; drink bottle',
    'take key and pick up bottle',
  ]) {
    const s = run(command);
    assert.equal(s.turn, 0, command);
    assert.equal(s.inventory.includes('key'), false, command);
    assert.equal(s.flags.includes('doorUnlocked'), false, command);
  }
  assert.equal(hasMultipleActions('ask the mouse about cats and dogs'), false);
  assert.equal(run('east', 'ask mouse about cats and dogs').flags.includes('mouseOffended'), true);
});

test('a gift pronoun is resolved before the conversation target changes', () => {
  const s = run('east', 'inspect comfits', 'give it to dodo');
  assert.ok(s.flags.includes('prizesGiven'));
  assert.equal(s.inventory.includes('comfits'), false);
});

test('new interpretations preserve save compatibility and repeatability', () => {
  const s = run('I pick the key up', 'I try the key on one of the doors');
  assert.deepEqual(deserialize(serialize(s)), s);
  assert.deepEqual(run('I pick the key up', 'I try the key on one of the doors'), s);
  const intent = parseCommand('I carefully try the key on one of the doors');
  assert.equal(intent.action, 'use');
  assert.equal(intent.item, 'the key');
  assert.equal(intent.target, 'one of the doors');
  assert.deepEqual(intent.modifiers, ['carefully']);
});
