# Narrative sources

**Lewis Carroll, _Alice’s Adventures in Wonderland_ (1865).** Public-domain literary work. Narrative and dialogue excerpts are drawn from the transcription at <https://www.gutenberg.org/files/11/11-h/11-h.htm>.

The adaptation does not include newly generated story passages. Narrative text lives in `src/content/wonderland.json`. All story-bearing records include a `chapter` field and are rendered with a chapter citation. The transcription was consulted on 29 October 2026.

| Chapter                            | Excerpts used                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| I, Down the Rabbit-Hole            | Hall, landing, passage, table, golden key, bottle, cake, little door, shrinking, Rabbit’s remarks      |
| II, The Pool of Tears              | Growing, Rabbit and fan, fan shrinking effect, Mouse, cats, apology/history dialogue, nearby creatures |
| III, A Caucus-Race and a Long Tale | Bank of the pool, comfits, thimble, Mouse and Dodo dialogue                                            |
| VII, A Mad Tea-Party               | Arrival in the garden                                                                                  |

Excerpts may begin or end mid-paragraph; punctuation and initial capitalization are adjusted at excerpt boundaries. No new dialogue is attributed to Carroll’s characters. Interface labels, status reports, quest progress labels, and parser fallback messages are technical descriptions of the adaptation’s simulation.

The map connects a subset of the novel’s locations into a small playable space. The bottle, cake, fan, item carrying, and access rules are simplified for a recoverable puzzle. These mechanics are an adaptation rather than a complete reproduction of the book’s chronology.

Before distributing new campaigns, record the author, precise source, license/public-domain basis, and any required attribution here. Only human-authored or appropriately licensed/public-domain narrative may be added.

# Visual and software assets

- `public/hall.svg`: code-native vector hall illustration created for this interface.
- `public/tavern.svg`: decorative code-native tavern interior for the homepage; not a campaign location or narrative passage.
- `public/parchment.svg`: subtle paper texture used across the tavern interface.
- Character sheet: CSS shield monogram and existing Lucide icons in `src/CharacterSheet.tsx`.
- Lucide React icons: ISC license, <https://lucide.dev/license>.
- Cinzel, Lora, and DM Sans: Google Fonts; local system font fallbacks are provided.
- Engine/UI source: prototype source provided in this workspace; no third-party story generation service is included.
