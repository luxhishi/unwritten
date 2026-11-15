import { useState } from 'react';
import { ArrowRight, BookOpen, Bookmark, Compass, Feather, Search, X } from 'lucide-react';
import stories from './content/library.json';
import { campaign, locationOf } from './engine/game';
import type { GameState } from './engine/types';
import './library.css';
import TavernShell from './TavernShell';

export default function Library({
  game,
  onOpenStory,
}: {
  game: GameState;
  onOpenStory: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const matches = stories.filter((story) =>
    [story.title, story.chapter, story.author, story.genre].some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  );
  const hasProgress = game.entries.some((entry) => entry.kind === 'command');
  const completed = game.flags.includes(campaign.quests[0].completedFlag);

  return (
    <TavernShell game={game} onOpenStory={onOpenStory}>
      <div className="library-page">
        <header className="library-header">
          <a href="#/" className="brand" aria-label="Unwritten home">
            <span className="brand-mark">
              <Feather size={27} />
            </span>
            <span>
              UNWRITTEN<small>A WORLD IN YOUR WORDS</small>
            </span>
          </a>
          <nav aria-label="Home navigation">
            <a href="#available-stories">
              Tavern board <BookOpen size={15} />
            </a>
            {hasProgress && (
              <button onClick={() => onOpenStory(campaign.id)}>
                <Bookmark size={15} /> Continue your story <ArrowRight size={15} />
              </button>
            )}
          </nav>
        </header>

        <main>
          <section className="library-hero" aria-labelledby="library-title">
            <div className="library-hero-inner">
              <span className="library-eyebrow">
                <span className="tiny-diamond" /> THE UNWRITTEN STORY TAVERN
              </span>
              <h1 id="library-title">
                A seat by the fire.
                <br />
                <em>A story to begin.</em>
              </h1>
              <p>
                Pull up a chair. Find a story worth getting lost in, and explore it in your own
                words—one typed action at a time.
              </p>
              <a className="library-browse" href="#available-stories">
                Find your next story <ArrowRight size={17} />
              </a>
            </div>
            <span className="library-hero-caption">
              <Feather size={15} /> Good stories. Warm company. Endless possibility.
            </span>
          </section>

          <section
            className="library-collection"
            id="available-stories"
            aria-labelledby="collection-title"
          >
            <div className="collection-heading">
              <div>
                <span className="library-eyebrow">TALES FROM THE TAVERN</span>
                <h2 id="collection-title">Choose a tale for the evening</h2>
                <p>
                  {stories.length} playable {stories.length === 1 ? 'story' : 'stories'}. A little
                  curiosity is all you need.
                </p>
              </div>
              <div className="library-search">
                <Search size={17} aria-hidden="true" />
                <input
                  aria-label="Search stories"
                  placeholder="Search stories or authors…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear story search">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <p className="library-result-count" role="status">
              {query
                ? `${matches.length} ${matches.length === 1 ? 'story' : 'stories'} found`
                : 'ALL STORIES'}
            </p>
            <div className="library-stories">
              {matches.map((story) => (
                <article
                  className="library-story"
                  key={story.id}
                  aria-labelledby={`story-${story.id}`}
                >
                  <div className="library-cover" style={{ backgroundImage: `url(${story.image})` }}>
                    <span className="library-cover-badge">
                      <BookOpen size={13} /> AVAILABLE TO PLAY
                    </span>
                    <div>
                      <span>CHAPTER I</span>
                      <h3>{story.chapter}</h3>
                      <span>THE WONDERLAND CHAPTERS</span>
                    </div>
                  </div>
                  <div className="library-story-details">
                    <div className="library-story-meta">
                      <span>{story.genre}</span>
                      <span>PUBLIC-DOMAIN LITERATURE</span>
                    </div>
                    <h3 id={`story-${story.id}`}>{story.title}</h3>
                    <p className="library-author">
                      From <i>Alice’s Adventures in Wonderland</i> · {story.author}
                    </p>
                    <blockquote>
                      “{story.excerpt}”
                      <cite>
                        <a href={story.source} target="_blank" rel="noreferrer">
                          {story.author} · Chapter {story.sourceChapter}
                        </a>
                      </cite>
                    </blockquote>
                    <div className="library-story-facts">
                      <span>
                        <Compass size={14} />
                        {campaign.locations.length} connected places
                      </span>
                      <span>
                        <BookOpen size={14} />1 playable chapter
                      </span>
                    </div>
                    {hasProgress && (
                      <div className="library-progress">
                        <Bookmark size={14} />
                        <span>
                          {completed ? 'Chapter completed' : 'In progress'} ·{' '}
                          {locationOf(game).name} · Turn {game.turn}
                        </span>
                      </div>
                    )}
                    <button
                      className="library-play"
                      aria-label={hasProgress ? 'Continue story' : 'Begin story'}
                      onClick={() => onOpenStory(story.id)}
                    >
                      {hasProgress ? 'Continue story' : 'Begin story'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {matches.length === 0 && (
              <div className="library-empty">
                <Search size={28} />
                <h3>No stories found</h3>
                <p>Try a different title, author, or genre.</p>
                <button onClick={() => setSearch('')}>
                  Show all stories <ArrowRight size={15} />
                </button>
              </div>
            )}
            <div className="library-principles">
              <div>
                <Feather size={22} />
                <h3>Your words, your way</h3>
                <p>
                  Type what you want to do. Explore through conversation, observation, and
                  experimentation.
                </p>
              </div>
              <div>
                <BookOpen size={22} />
                <h3>Stories with a source</h3>
                <p>
                  Human-authored literature, connected by game rules. Every narrative passage
                  carries a source reference.
                </p>
              </div>
              <div>
                <Bookmark size={22} />
                <h3>A place to return to</h3>
                <p>
                  Your adventure saves in this browser. Leave a bookmark and continue whenever
                  you’re ready.
                </p>
              </div>
            </div>
          </section>
        </main>
        <footer className="library-footer">
          <span>
            <Feather size={16} /> UNWRITTEN
          </span>
          <span>No choices. Just possibilities.</span>
          <a href="#available-stories">
            Explore the library <ArrowRight size={13} />
          </a>
        </footer>
      </div>
    </TavernShell>
  );
}
