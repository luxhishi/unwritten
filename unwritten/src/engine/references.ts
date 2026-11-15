import { normalize } from './parser';
import type { Entity } from './types';

export type ReferenceMatch =
  | { kind: 'found'; entity: Entity }
  | { kind: 'ambiguous'; entities: Entity[] }
  | { kind: 'missing' };

function singular(word: string): string {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(?:ches|shes|xes|zes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !/(?:ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}
export function canonicalReference(text: string): string {
  return normalize(text)
    .replace(/\b(?:one|any|some) of\b/g, '')
    .split(' ')
    .filter(
      (word) =>
        word &&
        ![
          'the',
          'a',
          'an',
          'my',
          'your',
          'this',
          'that',
          'these',
          'those',
          'one',
          'some',
          'any',
        ].includes(word),
    )
    .map(singular)
    .join(' ');
}
export function resolveReference(
  text: string,
  visible: Entity[],
  lastTarget: string,
  kind?: Entity['kind'],
): ReferenceMatch {
  const candidates = visible.filter((entity) => !kind || entity.kind === kind);
  if (/^(?:it|them|that|this)$/.test(normalize(text))) {
    const entity = candidates.find((entity) => entity.id === lastTarget);
    return entity ? { kind: 'found', entity } : { kind: 'missing' };
  }
  const reference = canonicalReference(text);
  if (!reference) return { kind: 'missing' };
  // Matching the whole noun phrase avoids silently redirecting an unknown
  // qualified object (such as an imaginary red door) to an unrelated target.
  const matches = candidates.filter((entity) =>
    entity.aliases.some((alias) => canonicalReference(alias) === reference),
  );
  if (matches.length === 1) return { kind: 'found', entity: matches[0] };
  return matches.length ? { kind: 'ambiguous', entities: matches } : { kind: 'missing' };
}
