# Unwritten

A playable TypeScript/React interactive fiction MVP. Players type actions; a local rule-based parser resolves them against a deterministic simulation. No model APIs, generated narrative, or AI story runtime is used.

## Run

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

`npm test` runs the engine scenarios. `npm run build` typechecks the entire project and creates the static production app in `dist/`. `npm run preview` serves that build.

## Playable chapter

The app opens on a story-library homepage at `/`, with campaign search, source credits, and a Begin/Continue button that reflects saved progress. The game lives at `#/stories/wonderland`. Its Library control returns home without resetting progress; browser back/forward navigation also works.

`src/content/library.json` holds catalogue metadata, artwork paths, and sourced preview excerpts. Only Wonderland is currently playable. Add a catalogue entry only when its campaign is implemented and registered in the game adapter.

The Wonderland Chapters is a compact adaptation of Lewis Carroll’s public-domain _Alice’s Adventures in Wonderland_. Five connected places, Alice as the player character, three NPCs, six portable items, and one main quest demonstrate text interaction without generating narrative. Every story/dialogue excerpt has a chapter reference and source link. See [SOURCES.md](SOURCES.md).

Type one action at a time in your own words. Inspection, searching, taking, dropping, using, drinking, eating, travel, conversation, topic questions, gifts, climbing, and waiting are supported. Synonyms include “examine”, “look at”, “grab”, “collect”, “travel”, and “speak to”. Pronouns refer to the last recognized target. The parser is intentionally bounded; unsupported actions produce a system response and leave simulation time unchanged.

The interface provides a transcript, journal, inventory, location map, reading settings, manual save slot, autosave, and save-file import/export. Navigation buttons only open information panels. Actions and dialogue use the text field.

## Architecture

### Natural-language interpretation

The parser recognizes supported intents across sentence frames rather than requiring one exact command. It removes optional request prefixes and adverbs, recognizes multiword patterns, and extracts the action, target, tool, and conversation topic. `src/engine/references.ts` then canonicalizes object phrases (articles, possessives, and regular plurals) and resolves them against visible entities and inventory aliases.

For example, after collecting the key, `I try the key on one of the doors`, `I insert the golden key into the lock`, and `I use the key to unlock the door` resolve to the same existing rule. The engine reports the selected key/door interpretation. It still checks possession, location, and outcome conditions before changing the world.

`I check the little bottle` followed by `I put it in my pocket` uses the last recognized object as the pronoun reference. A reference matching multiple visible entities produces a clarification message listing their names; the player repeats the action with a specific name. Clarification does not advance time or change simulation state, and does not introduce a pending-input field in existing saves.

Unknown qualifiers are not discarded to force a match: an `imaginary rusty key` will not silently become the golden key. Negated instructions and recognized multiple-action clauses do not execute partial actions. The parser remains bounded: new mechanics still require engine support, while new sentence frames belong in the parser and object vocabulary belongs in content aliases. Maintain player-language regression cases in `tests/language.test.ts` as supported wording grows. No model service or external NLP dependency is used.

- `src/engine/parser.ts`: normalization and structured intents; no story text.
- `src/engine/game.ts`: pure `execute(state, command)` function; scoped target resolution, rule evaluation, effects, inventory, movement, deterministic d20 checks, weighted events, cooldowns, and quest completion.
- `src/engine/types.ts`: simulation and content contracts.
- `src/content/wonderland.json`: sourced passages, entity aliases, locations, rules, travel gates, quest steps, and event definitions.
- `src/engine/storage.ts`: versioned serialization and untrusted-save validation.
- `src/main.tsx`: React UI adapter. The engine imports no React, browser storage, or DOM APIs and can also run under Node.js.
- `tests/engine.test.ts`: end-to-end command scenarios and persistence invariants.

Writers can add entities, connected locations, dialogue branches, rule effects, gates, quest definitions, and events in the JSON content without modifying the engine. New simulation verbs or mechanics require engine work. UI map coordinates have authored placements for the initial five rooms and automatic positions for additions.

### Content rules

Rules are evaluated in file order. The first matching action/target/topic whose conditions are met executes. Put specific dialogue branches before generic greetings. Narrative text is kept separate from system state messages.

```json
{
  "id": "example-rule",
  "actions": ["ask", "talk"],
  "target": "character-id",
  "topic": "history|story",
  "conditions": [{ "notFlag": "characterOffended" }],
  "effects": [{ "flag": "historyHeard" }, { "remember": ["character-id", "history shared"] }],
  "passage": { "text": "Insert human-authored or licensed text here.", "chapter": "I" }
}
```

Supported conditions: `flag`, `notFlag`, `hasItem`, `size`, `location`, `trustAtLeast`, `trustBelow`, and recursive `any` alternatives. Objects in a conditions array combine with AND. Supported effects: set/unset flags, add/remove items, set size, adjust trust, and remember an interaction. Entities can have visibility conditions. Travel gates supply conditions and sourced blocking passages or system messages. Quests declare completion conditions and progress steps. Events declare weights, conditions, and turn cooldowns.

Only include text whose authorship and license you can verify. Record its source and chapter alongside the passage. New original narrative must come from human writers.

## Persistence and scope

The tavern sidebar provides Home (`#/`), Story Library (`#/library`), Ongoing Stories (`#/ongoing`), Character Sheets (`#/characters`), and Profile (`#/profile`). The mobile sidebar supports Escape, keyboard focus containment, and background scroll locking. Ongoing stories and character details derive from the existing campaign state; completed campaigns have a separate empty-state message with a revisit action.

Profiles contain a display name and optional biography, saved separately in `unwritten.profile.v1` in browser localStorage. This is a local profile rather than an account. Profiles do not change campaign saves or require a backend.

This first version uses browser-local persistence. It does not implement accounts, cloud sync, a Node HTTP server, or PostgreSQL. The manual slot is separate from autosave; exported JSON preserves the PRNG seed, transcript, flags, inventory, NPC memory, and event cooldowns. Restoring the same seed and command sequence reproduces results. Saves are capped and validated before replacing the current state. Import does not execute script or render HTML.

The future server adapter can load a `GameState`, call `execute`, and transactionally store the resulting state in PostgreSQL. A recommended account save model is `saves(id, user_id, campaign_id, schema_version, revision, state jsonb, updated_at)`, with owner-scoped authorization, optimistic revision checks, and server-validated commands. No database service is required by this MVP.

Combat, factions, character death, night/day simulation, account storage, and multiple campaign endings are future systems. Attack verbs are recognized and return an explicit unsupported-system message in this chapter. The garden is the chapter’s single completion state; the bottle, fan, and size/reach mechanics provide alternative puzzle routes.

## Presentation

The hall artwork is a repository-native SVG, with no generated narrative or remote image dependency. Icons are from Lucide (ISC license). React/Vite are bundled into the production build; the only optional runtime network dependency is Google Fonts, with system font fallbacks.
