import type { Action, Intent } from './types';

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const adverbs = /\b(?:carefully|gently|quietly|quickly|slowly|cautiously|politely)\b/g;
const prefix =
  /^(?:please|can i|could i|may i|i want to|i would like to|i d like to|i m going to|i am going to|i decide to|i ll|i will|i|try to|attempt to)\s+/;
const verbs: [RegExp, Action][] = [
  [/^(?:look around(?: the room)?|look about|look|observe|l)$/, 'look'],
  [
    /^(?:take a look at|have a look at|look closely at|look at|examine|inspect|study|read|check out|check|x)\b/,
    'inspect',
  ],
  [
    /^(?:search inside|search|look under|look behind|rummage through|rummage|look inside)\b/,
    'search',
  ],
  [/^(?:pick up|take|grab|collect|get|pocket|retrieve)\b/, 'take'],
  [/^(?:put down|drop|leave)\b/, 'drop'],
  [/^(?:say hello to|talk to|speak to|speak with|talk with|chat with|greet|talk)\b/, 'talk'],
  [/^(?:apologize to|apologise to|say sorry to|ask|question|tell)\b/, 'ask'],
  [
    /^(?:go to|travel to|head to|walk to|move to|return to|crawl through|sneak into|enter|go|travel|head|walk|move|return|sneak|follow)\b/,
    'go',
  ],
  [/^(?:drink|sip|taste|swallow)\b/, 'drink'],
  [/^(?:eat|nibble|bite)\b/, 'eat'],
  [/^(?:fan myself with|fan myself|use|unlock|open|wave|apply)\b/, 'use'],
  [/^(?:give|offer|hand)\b/, 'give'],
  [/^(?:climb|scale)\b/, 'climb'],
  [/^(?:attack|hit|strike|stab|slash|fight)\b/, 'attack'],
  [/^(?:wait|rest|sleep|z)$/, 'wait'],
  [/^(?:help|commands)$/, 'help'],
  [/^(?:inventory|bag|satchel|i)$/, 'inventory'],
  [/^(?:journal|quest|quests)$/, 'journal'],
  [/^(?:stats|status|character)$/, 'stats'],
  [/^(?:save|save game)$/, 'save'],
  [/^(?:load|load game|restore)$/, 'load'],
];
function unwrap(text: string): string {
  let previous: string;
  do {
    previous = text;
    text = text.replace(prefix, '').trim();
  } while (previous !== text);
  return text;
}
export function parseCommand(raw: string): Intent {
  const normalized = normalize(raw);
  const modifiers = [...new Set(normalized.match(adverbs) ?? [])];
  if (/\bbehind\b/.test(normalized)) modifiers.push('behind');
  const [command, ...topics] = normalized.split(/\babout\b/);
  const text = unwrap(
    command
      .replace(adverbs, '')
      .replace(/\bplease\b/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  let topic = topics.join('about').trim();
  const intent: Intent = { action: 'unknown', target: '', item: '', topic, modifiers, raw };
  // Never turn a negated attempt into a real action. Dialogue topics are excluded.
  if (/\b(?:not|never|don t|do not|won t|without)\b/.test(text)) return intent;
  if (raw.trim() === '?') return { ...intent, action: 'help' };
  // Multiword intent frames run before simple verb recognition.
  const pickUp = text.match(/^(?:pick|lift)\s+(.+?)\s+up(?:\s+(?:from|off)\s+.+)?$/);
  if (pickUp) return { ...intent, action: 'take', target: pickUp[1] };
  const pocket = text.match(
    /^(?:put|place|stash|tuck)\s+(.+?)\s+(?:in|into|inside)\s+(?:(?:my|the|a)\s+)?(?:pocket|bag|satchel|inventory)$/,
  );
  if (pocket) return { ...intent, action: 'take', target: pocket[1] };
  const toolForAction = text.match(
    /^(?:use|try|apply)\s+(.+?)\s+to\s+(?:try to\s+)?(?:open|unlock)\s+(.+)$/,
  );
  if (toolForAction)
    return { ...intent, action: 'use', item: toolForAction[1], target: toolForAction[2] };
  const toolOnTarget = text.match(
    /^(?:try|test|attempt|insert|fit|put|turn)\s+(.+?)\s+(?:on|in|into|against)\s+(.+)$/,
  );
  if (toolOnTarget)
    return { ...intent, action: 'use', item: toolOnTarget[1], target: toolOnTarget[2] };
  const verb = verbs.find(([pattern]) => pattern.test(text));
  const direction = /^(?:north|south|east|west|n|s|e|w|back)$/;
  let action: Action = verb?.[1] ?? (direction.test(text) ? 'go' : 'unknown');
  const rest = verb ? text.replace(verb[0], '').trim() : text;
  let target = rest;
  let item = '';
  if (/^(?:apologi[sz]e|say sorry)\b/.test(text)) {
    action = 'ask';
    topic = 'apology';
  }
  if (action === 'use' && /\bon\b/.test(rest)) {
    const [object, ...destination] = rest.split(/\bon\b/);
    item = object.trim();
    target = destination.join('on').trim();
  } else if ((action === 'use' || action === 'attack') && /\b(?:with|using)\b/.test(rest)) {
    const [object, ...method] = rest.split(/\b(?:with|using)\b/);
    target = object.trim();
    item = method.join(' ').trim();
  }
  if (action === 'give' && /\bto\b/.test(rest)) {
    const [object, ...recipient] = rest.split(/\bto\b/);
    item = object.trim();
    target = recipient.join('to').trim();
  }
  if (action === 'take')
    target = target
      .replace(/^(.+?)\s+up\b/, '$1')
      .split(/\b(?:from|off)\b/)[0]
      .trim();
  if (action === 'go') target = target.replace(/^(?:to|toward|towards)\s+/, '').trim();
  return { action, target, item, topic, modifiers, raw };
}
export function hasMultipleActions(raw: string): boolean {
  // A conjunction in a dialogue topic (cats and dogs) is not a second action.
  const clauses = raw.split(/\b(?:and(?:\s+then)?|then|afterwards)\b|;/i);
  return clauses.slice(1).some((clause) => parseCommand(clause).action !== 'unknown');
}
