import {
  Backpack,
  Coins,
  Heart,
  Shield,
  KeyRound,
  FlaskConical,
  Cookie,
  Fan,
  Package,
  CircleDot,
} from 'lucide-react';
import { entityById, sizeLabel } from './engine/game';
import type { GameState } from './engine/types';

const flagLabels: Record<string, string> = {
  doorUnlocked: 'Door unlocked',
  doorSeen: 'Little door discovered',
  cakeFound: 'Cake discovered',
  cakeUsed: 'Cake eaten',
  bottleUsed: 'Bottle consumed',
  rabbitMet: 'Rabbit acquainted',
  mouseOffended: 'Mouse offended',
  mouseStory: 'Mouse’s history heard',
  prizesGiven: 'Prizes shared',
  gardenReached: 'Garden reached',
  tableClimbed: 'Table climbed',
};
const itemIcons = {
  key: KeyRound,
  bottle: FlaskConical,
  cake: Cookie,
  fan: Fan,
  thimble: CircleDot,
  box: Package,
};

export default function CharacterSheet({ game }: { game: GameState }) {
  return (
    <section className="character-sheet" aria-labelledby="character-sheet-title">
      <div className="sheet-heading">
        <Shield size={15} />
        <span id="character-sheet-title">Character sheet</span>
        <span className="sheet-level">I</span>
      </div>
      <div className="sheet-identity">
        <span className="sheet-monogram" aria-hidden="true">
          A
        </span>
        <div>
          <h2>Alice</h2>
          <p>The curious traveler</p>
        </div>
      </div>
      <div className="sheet-resources">
        <div className="sheet-resource sheet-hp" aria-label="HP: not tracked in this chapter">
          <span>
            <Heart size={13} /> HP
          </span>
          <strong>—</strong>
          <small>Not tracked</small>
        </div>
        <div className="sheet-resource sheet-gold" aria-label="Gold: not tracked in this chapter">
          <span>
            <Coins size={13} /> Gold
          </span>
          <strong>—</strong>
          <small>Not tracked</small>
        </div>
      </div>
      <div className="sheet-attributes" aria-label="Character attributes">
        {Object.entries(game.stats).map(([name, score]) => (
          <div key={name}>
            <strong>{score}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="sheet-inventory">
        <h3>
          <Backpack size={12} /> Carried items <span>{game.inventory.length}</span>
        </h3>
        <div className="sheet-slots">
          {game.inventory.map((id) => {
            const item = entityById(id)!;
            const Icon = itemIcons[item.icon as keyof typeof itemIcons] ?? Package;
            return (
              <span className="sheet-slot" key={id} title={item.name}>
                <Icon size={18} aria-hidden="true" strokeWidth={1.4} />
                <small>{item.name}</small>
              </span>
            );
          })}
          {Array.from({ length: Math.max(0, 4 - game.inventory.length) }, (_, i) => (
            <span
              className="sheet-slot empty-slot"
              key={`empty-${i}`}
              aria-label="Empty inventory slot"
            >
              <span aria-hidden="true">+</span>
            </span>
          ))}
        </div>
      </div>
      <div className="sheet-conditions">
        <h3>Conditions</h3>
        <span className="condition-chip">Size · {sizeLabel(game)}</span>
        {game.flags.includes('mouseOffended') && (
          <span className="condition-chip condition-crimson">Mouse offended</span>
        )}
      </div>
      <details className="sheet-flags">
        <summary>
          Active story flags <span>{game.flags.length}</span>
        </summary>
        {game.flags.length ? (
          <ul>
            {game.flags.map((flag) => (
              <li key={flag}>{flagLabels[flag] ?? flag.replace(/([a-z])([A-Z])/g, '$1 $2')}</li>
            ))}
          </ul>
        ) : (
          <p>No story flags yet.</p>
        )}
      </details>
    </section>
  );
}
