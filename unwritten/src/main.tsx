import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpen,
  Feather,
  Compass,
  Backpack,
  Map,
  Settings,
  Bookmark,
  ArrowUpRight,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  KeyRound,
  FlaskConical,
  Cookie,
  Fan,
  Package,
  CircleDot,
  X,
  Download,
  Upload,
  RotateCcw,
  Check,
  ChevronRight,
  CircleHelp,
  Sun,
  Leaf,
  ScrollText,
  Menu,
  VolumeX,
} from 'lucide-react';
import {
  campaign,
  entityById,
  execute,
  locationOf,
  meets,
  newGame,
  note,
  sizeLabel,
  visibleEntities,
} from './engine/game';
import { parseCommand } from './engine/parser';
import { AUTO_KEY, SLOT_KEY, deserialize, readSave, serialize, writeSave } from './engine/storage';
import type { Entry, GameState } from './engine/types';
import './styles.css';
import Library from './Library';
import './tavern.css';
import CharacterSheet from './CharacterSheet';
import './tabletop.css';

type View = 'story' | 'journal' | 'inventory' | 'map' | 'guide';
type Modal = 'settings' | 'saves' | 'credits' | null;
const icons = {
  key: KeyRound,
  bottle: FlaskConical,
  cake: Cookie,
  fan: Fan,
  thimble: CircleDot,
  box: Package,
};
function ItemIcon({ icon, size = 22 }: { icon?: string; size?: number }) {
  const Icon = icons[icon as keyof typeof icons] ?? Package;
  return <Icon size={size} strokeWidth={1.5} />;
}
function App() {
  const [page, setPage] = useState(() =>
    window.location.hash === `#/stories/${campaign.id}` ? 'game' : 'library',
  );
  useEffect(() => {
    const onHashChange = () =>
      setPage(window.location.hash === `#/stories/${campaign.id}` ? 'game' : 'library');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [warning, setWarning] = useState('');
  const [game, setGame] = useState<GameState>(() => {
    try {
      return readSave(AUTO_KEY) ?? newGame();
    } catch {
      return newGame();
    }
  });
  const [view, setView] = useState<View>('story');
  const [modal, setModal] = useState<Modal>(null);
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return Number(localStorage.getItem('unwritten.font')) || 18;
    } catch {
      return 18;
    }
  });
  const [resetPending, setResetPending] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [slot, setSlot] = useState<GameState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const historyIndex = useRef(-1);
  const loc = locationOf(game);
  const completed = game.flags.includes('gardenReached');
  useEffect(() => {
    try {
      writeSave(AUTO_KEY, game);
      setWarning('');
    } catch {
      setWarning(
        'Browser storage is unavailable. Export your save from Saved games to keep your progress.',
      );
    }
  }, [game]);
  useEffect(() => {
    feedRef.current?.scrollTo({
      top:
        view === 'story' && game.entries.some((e) => e.kind === 'command')
          ? feedRef.current.scrollHeight
          : 0,
      behavior: 'instant',
    });
  }, [game.entries.length, view, page]);
  useEffect(() => {
    if (modal) {
      modalRef.current?.focus();
      try {
        setSlot(readSave(SLOT_KEY));
      } catch {
        setWarning('The browser save slot could not be read.');
      }
    } else {
      setResetPending(false);
    }
  }, [modal]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setMobileNav(false);
      }
      if (e.key === '/' && page === 'game' && !(e.target instanceof HTMLInputElement) && !modal) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, page]);
  const chooseView = (v: View) => {
    setView(v);
    setMobileNav(false);
  };
  const save = () => {
    try {
      writeSave(SLOT_KEY, game);
      setSaved(true);
      setSlot(game);
      setGame((g) => note(g, 'Progress saved to the browser save slot.'));
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setWarning('Saving is unavailable in this browser. Export a save file instead.');
    }
  };
  const load = () => {
    try {
      const s = readSave(SLOT_KEY);
      if (s) {
        setGame(note(s, 'Browser save loaded.'));
        setView('story');
        setModal(null);
      } else setWarning('The save slot is empty. Save your progress first.');
    } catch {
      setWarning('The saved game is incompatible or damaged. Your current game has been kept.');
    }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const command = input;
    setInput('');
    historyIndex.current = -1;
    setView('story');
    const action = parseCommand(command).action;
    if (action === 'save') save();
    else if (action === 'load') load();
    else setGame((g) => execute(g, command));
    inputRef.current?.focus();
  };
  const exportSave = () => {
    const url = URL.createObjectURL(new Blob([serialize(game)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unwritten-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importSave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('This save file is too large.');
      const state = deserialize(await file.text());
      setGame(note(state, 'Save file imported.'));
      setView('story');
      setModal(null);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : 'Unable to read this save.');
    }
    e.target.value = '';
  };
  const onHistory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const history = game.entries
        .filter((e) => e.kind === 'command')
        .map((e) => e.text)
        .reverse();
      if (!history.length) return;
      e.preventDefault();
      historyIndex.current = Math.max(
        -1,
        Math.min(history.length - 1, historyIndex.current + (e.key === 'ArrowUp' ? 1 : -1)),
      );
      setInput(historyIndex.current < 0 ? '' : history[historyIndex.current]);
    }
  };
  const navigation: [View, string, typeof BookOpen][] = [
    ['story', 'Your story', BookOpen],
    ['journal', 'Journal', ScrollText],
    ['inventory', 'Inventory', Backpack],
    ['map', 'World map', Map],
  ];
  const openStory = (id: string) => {
    window.location.hash = `/stories/${id}`;
    setPage('game');
    setView('story');
    setMobileNav(false);
  };
  const goHome = () => {
    window.location.hash = '/';
    setPage('library');
    setModal(null);
    setMobileNav(false);
  };
  if (page === 'library') return <Library game={game} onOpenStory={openStory} />;
  return (
    <div className="app-shell" style={{ '--reading-size': `${fontSize}px` } as React.CSSProperties}>
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          aria-label="Unwritten home"
        >
          <span className="brand-mark">
            <Feather size={25} />
          </span>
          <span>
            UNWRITTEN<small>A WORLD IN YOUR WORDS</small>
          </span>
        </a>
        <div className="campaign-tag">
          <span className="tiny-diamond" /> THE WONDERLAND CHAPTERS
        </div>
        <div className="sidebar-rule" />
        <p className="nav-label">YOUR ADVENTURE</p>
        <nav aria-label="Game navigation">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-link ${view === id ? 'active' : ''}`}
              onClick={() => chooseView(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.5} />
              <span>{label}</span>
              {id === 'inventory' ? (
                <span className="nav-count">{game.inventory.length}</span>
              ) : id === 'journal' ? (
                <span className="nav-dot" />
              ) : null}
              {view === id && <ChevronRight className="nav-chevron" size={14} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-rule small" />
        <button
          className={`nav-link guide-link ${view === 'guide' ? 'active' : ''}`}
          onClick={() => chooseView('guide')}
        >
          <CircleHelp size={19} strokeWidth={1.5} />
          Field guide
          <ArrowUpRight size={14} className="nav-chevron" />
        </button>
        <div className="sidebar-spacer" />
        <CharacterSheet game={game} />
        <button className="save-button" onClick={save}>
          {saved ? <Check size={17} /> : <Bookmark size={17} />}
          <span>{saved ? 'Progress saved' : 'Save progress'}</span>
          <span className="save-dot" />
        </button>
        <div className="sidebar-bottom">
          <span>
            <span className="status-dot" />
            {warning ? 'Export to keep progress' : 'Autosave is on'}
          </span>
          <button onClick={() => setModal('settings')} aria-label="Open settings">
            <Settings size={17} />
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button className="nav-shade" aria-label="Close menu" onClick={() => setMobileNav(false)} />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open menu"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={21} />
            </button>
            <button className="library-back" onClick={goHome} aria-label="Back to story library">
              <BookOpen size={14} /> Library
            </button>
            <ChevronRight size={13} />
            <span className="breadcrumb-title">The Wonderland Chapters</span>
            <ChevronRight size={13} />
            <span>Chapter I</span>
          </div>
          <div className="topbar-right">
            <span className="live-label">
              <span className="status-dot" />
              YOUR STORY IS UNFOLDING
            </span>
            <button
              className="icon-button"
              aria-label="Saved games"
              onClick={() => setModal('saves')}
            >
              <Bookmark size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Settings"
              onClick={() => setModal('settings')}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
        <div className="game-layout">
          <main className="main-column">
            <section
              className={`location-scene scene-${game.location}`}
              aria-label={`Current location: ${loc.name}`}
            >
              <div className="scene-wash" />
              <div className="scene-top">
                <span>
                  <Compass size={13} />{' '}
                  {game.location === 'hall' ? 'THE FIRST DESCENT' : loc.subtitle.toUpperCase()}
                </span>
                <span>
                  <Sun size={13} /> A curious afternoon
                </span>
              </div>
              <div className="scene-title">
                <div className="chapter-kicker">
                  CHAPTER I <span /> DOWN THE RABBIT-HOLE
                </div>
                <h1>{loc.name}</h1>
                <p>{loc.subtitle}</p>
              </div>
              <span className="location-chip">
                <CircleDot size={12} /> {game.visited.length} of {campaign.locations.length} places
                discovered
              </span>
            </section>
            <div
              ref={feedRef}
              className="reading-area"
              tabIndex={0}
              aria-label="Story and game panels"
            >
              {view === 'story' ? (
                <div className="story-feed">
                  <div className="section-label">
                    <span className="line" />
                    <Feather size={16} />
                    <span>YOUR STORY</span>
                    <span className="line" />
                  </div>
                  <div className="arrival-marker">
                    {game.turn === 0
                      ? 'The beginning of something curious'
                      : 'Every word leaves a trace'}
                  </div>
                  <div
                    className="entries"
                    role="log"
                    aria-label="Story transcript"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {game.entries.map((entry, i) => (
                      <StoryEntry key={entry.id} entry={entry} first={i === 0} />
                    ))}
                  </div>
                  {game.turn === 0 && (
                    <div className="story-pause">
                      <span />✧<span />
                    </div>
                  )}
                </div>
              ) : view === 'journal' ? (
                <Journal game={game} />
              ) : view === 'inventory' ? (
                <Inventory game={game} />
              ) : view === 'map' ? (
                <WorldMap game={game} />
              ) : (
                <Guide onCredits={() => setModal('credits')} />
              )}
            </div>
            <div className="command-dock">
              {warning && (
                <div className="storage-warning" role="status">
                  {warning}
                  <button aria-label="Dismiss message" onClick={() => setWarning('')}>
                    <X size={13} />
                  </button>
                </div>
              )}
              <div className="command-label">
                <label htmlFor="command">WHAT DO YOU DO?</label>
                <span>Your words shape the way forward.</span>
              </div>
              <form onSubmit={submit} className="command-form">
                <span className="prompt-mark">›</span>
                <input
                  id="command"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onHistory}
                  placeholder="Write your next action…"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                  aria-describedby="command-hint"
                />
                <button type="submit" disabled={!input.trim()} aria-label="Submit action">
                  <ArrowRight size={21} />
                </button>
              </form>
              <div className="command-footer">
                <span id="command-hint">
                  <CornerDownLeft size={12} /> Enter to act{' '}
                  <span className="footer-separator">·</span> ↑ ↓ command history
                </span>
                <span>NO CHOICES. JUST POSSIBILITIES.</span>
              </div>
            </div>
          </main>
          <aside className="right-rail">
            <div className="rail-heading">
              <ScrollText size={15} />
              <span>THE THREAD SO FAR</span>
              <span className="tiny-diamond" />
            </div>
            <div className="quest-card">
              <div className="quest-topline">
                <span className="quest-index">01</span>
                <span className="quest-state">{completed ? 'COMPLETE' : 'MAIN THREAD'}</span>
              </div>
              <h2>
                Through the
                <br />
                little door
              </h2>
              <p>Find a way into the garden.</p>
              <div className="quest-progress">
                <span className={game.flags.includes('doorUnlocked') ? 'done' : ''} />
                <span className={game.size === 'small' ? 'done' : ''} />
                <span className={completed ? 'done' : ''} />
              </div>
              <span className="quest-caption">
                {completed
                  ? 'A new chapter awaits.'
                  : game.flags.includes('doorUnlocked')
                    ? 'The door is open. The puzzle isn’t over.'
                    : 'Some doors require a little curiosity.'}
              </span>
              <button className="text-link" onClick={() => chooseView('journal')}>
                Open journal <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="rail-section">
              <h3>
                <Compass size={15} /> AROUND YOU
              </h3>
              <p className="rail-location">{loc.name}</p>
              <div className="nearby-list">
                {visibleEntities(game)
                  .filter((e) => !game.inventory.includes(e.id))
                  .map((e) => (
                    <div key={e.id}>
                      <span className={e.kind === 'npc' ? 'npc-dot' : 'object-dot'} />
                      {e.name}
                      <span>{e.kind === 'npc' ? 'character' : 'object'}</span>
                    </div>
                  ))}
              </div>
              <p className="rail-note">Observe closely. Small things matter.</p>
            </div>
            <div className="rail-section pocket-section">
              <h3>
                <Backpack size={15} /> IN YOUR POCKET
              </h3>
              <div className="pocket-icons">
                {game.inventory.slice(0, 5).map((id) => (
                  <span key={id} title={entityById(id)!.name}>
                    <ItemIcon icon={entityById(id)!.icon} size={20} />
                  </span>
                ))}
                {!game.inventory.length && <small>Empty, for now.</small>}
              </div>
              <button className="text-link" onClick={() => chooseView('inventory')}>
                View inventory <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="literary-note">
              <Leaf size={23} strokeWidth={1.2} />
              <p>
                A world from the page.
                <br />
                An adventure in your words.
              </p>
              <button onClick={() => setModal('credits')}>
                ABOUT THIS CHAPTER <ArrowUpRight size={12} />
              </button>
            </div>
          </aside>
        </div>
      </div>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={importSave}
        aria-label="Import save file"
      />
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            ref={modalRef}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const nodes = modalRef.current?.querySelectorAll<HTMLElement>('button,input,a');
                if (!nodes?.length) return;
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            <div className="modal-symbol">
              {modal === 'credits' ? (
                <Feather size={26} />
              ) : modal === 'saves' ? (
                <Bookmark size={26} />
              ) : (
                <Settings size={26} />
              )}
            </div>
            <h2 id="modal-title">
              {modal === 'credits'
                ? 'Words with a history'
                : modal === 'saves'
                  ? 'A place to return to'
                  : 'Make yourself at home'}
            </h2>
            {modal === 'credits' ? (
              <>
                <p>
                  The Wonderland Chapters uses excerpts from <i>Alice’s Adventures in Wonderland</i>{' '}
                  (1865), by Lewis Carroll. Every narrative passage and character quotation is drawn
                  from this public-domain work, with chapter references.
                </p>
                <p>
                  The map and puzzles form a compact literary adaptation. Location arrangement and
                  item rules simplify the book for play. Interface messages report simulation state.
                </p>
                <p>
                  This game uses a rule-based parser and seeded game logic. There are no language
                  models, generated story passages, or runtime AI services.
                </p>
                <a
                  className="primary-button"
                  href={campaign.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the original text <ArrowUpRight size={16} />
                </a>
              </>
            ) : modal === 'saves' ? (
              <>
                <p>
                  Your game autosaves on this browser. The manual slot preserves a separate point
                  you can return to.
                </p>
                <div className="save-slot">
                  <Bookmark size={24} />
                  <div>
                    <b>{slot ? locationOf(slot).name : 'An empty bookmark'}</b>
                    <span>
                      {slot ? `Turn ${slot.turn} · ${sizeLabel(slot)}` : 'No manual save yet'}
                    </span>
                  </div>
                  <button className="secondary-button" disabled={!slot} onClick={load}>
                    Load
                  </button>
                </div>
                <div className="modal-actions">
                  <button className="primary-button" onClick={save}>
                    <Bookmark size={16} />
                    Save current progress
                  </button>
                  <button className="secondary-button" onClick={exportSave}>
                    <Download size={16} />
                    Export save
                  </button>
                  <button className="secondary-button" onClick={() => fileRef.current?.click()}>
                    <Upload size={16} />
                    Import save
                  </button>
                </div>
                <p className="fine-print">
                  Saves are local to this browser. Export a file to move your story to another
                  device.
                </p>
              </>
            ) : (
              <>
                <p>A little room to make the story your own.</p>
                <div className="setting-row">
                  <label htmlFor="font-size">Reading size</label>
                  <select
                    id="font-size"
                    value={fontSize}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setFontSize(n);
                      try {
                        localStorage.setItem('unwritten.font', String(n));
                      } catch {
                        /* Preference remains available this session. */
                      }
                    }}
                  >
                    <option value={16}>Small</option>
                    <option value={18}>Comfortable</option>
                    <option value={21}>Large</option>
                  </select>
                </div>
                <div className="setting-row">
                  <span>
                    <VolumeX size={16} />
                    Sound
                  </span>
                  <span className="muted">A quiet reading experience</span>
                </div>
                <button className="secondary-button wide" onClick={() => setModal('saves')}>
                  <Bookmark size={16} />
                  Manage saved games
                </button>
                <div className="restart-section">
                  <h3>Begin again</h3>
                  <p>
                    {resetPending
                      ? 'Start a fresh chapter? Autosave will be replaced. Your manual save slot will remain available.'
                      : 'Return to the Hall of Doors and start a fresh chapter.'}
                  </p>
                  <button
                    className={resetPending ? 'danger-button' : 'text-link'}
                    onClick={() => {
                      if (!resetPending) {
                        setResetPending(true);
                        return;
                      }
                      setGame(newGame());
                      setView('story');
                      setModal(null);
                      setInput('');
                    }}
                  >
                    <RotateCcw size={15} />
                    {resetPending ? 'Yes, start a new chapter' : 'Restart this chapter'}
                  </button>
                  {resetPending && (
                    <button
                      className="text-link cancel-reset"
                      onClick={() => setResetPending(false)}
                    >
                      Keep playing
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function StoryEntry({ entry, first }: { entry: Entry; first: boolean }) {
  if (entry.kind === 'command')
    return (
      <div className="command-entry">
        <span>›</span>
        <div>{entry.text}</div>
        <span className="parsed-action">
          {entry.intent?.action === 'unknown' ? 'unrecognized' : entry.intent?.action}
        </span>
      </div>
    );
  if (entry.kind === 'system')
    return (
      <div className="system-entry">
        <span className="system-diamond" />
        <p>{entry.text}</p>
      </div>
    );
  return (
    <div
      className={`story-entry ${first ? 'first-entry' : ''} ${entry.kind === 'dialogue' ? 'dialogue-entry' : ''}`}
    >
      {entry.speaker && <div className="speaker-label">{entry.speaker}</div>}
      <p>{entry.text}</p>
      <a
        className="passage-source"
        href={`${campaign.source}#chap${({ I: '01', II: '02', III: '03', VII: '07' } as Record<string, string>)[entry.chapter ?? 'I'] ?? '01'}`}
        target="_blank"
        rel="noreferrer"
        title={`Lewis Carroll · Chapter ${entry.chapter}`}
      >
        CARROLL · {entry.chapter}
      </a>
    </div>
  );
}
function PanelTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="panel-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
function Inventory({ game }: { game: GameState }) {
  return (
    <section className="content-panel">
      <PanelTitle
        eyebrow="YOUR BELONGINGS"
        title="A pocketful of possibilities"
        description={`${game.inventory.length} ${game.inventory.length === 1 ? 'item' : 'items'} carried. Use your words to inspect, use, or give an item.`}
      />
      <div className="inventory-grid">
        {game.inventory.map((id) => {
          const item = entityById(id)!;
          return (
            <article className="inventory-card" key={id}>
              <div className="item-art">
                <ItemIcon icon={item.icon} size={34} />
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description.text}</p>
                <span>CARROLL · {item.description.chapter}</span>
              </div>
            </article>
          );
        })}
      </div>
      {!game.inventory.length && (
        <div className="empty-panel">
          <Backpack size={32} />
          <p>Your inventory is empty.</p>
        </div>
      )}
    </section>
  );
}
function Journal({ game }: { game: GameState }) {
  const quest = campaign.quests[0];
  const objectives = quest.steps.map((step) => [step.label, meets(game, step.conditions)] as const);
  return (
    <section className="content-panel">
      <PanelTitle
        eyebrow="YOUR JOURNAL"
        title="Follow the thread"
        description="A record of what you have discovered, and what is still unfolding."
      />
      <article className="journal-main">
        <span className="eyebrow">MAIN THREAD · CHAPTER I</span>
        <h3>Through the little door</h3>
        <p>Find a way into the garden.</p>
        <div className="objectives">
          {objectives.map(([label, done]) => (
            <div className={done ? 'objective done' : 'objective'} key={label}>
              {done ? <Check size={15} /> : <span />}
              {label}
            </div>
          ))}
        </div>
      </article>
      <h3 className="panel-subhead">People remember</h3>
      <div className="memory-list">
        {campaign.entities
          .filter((e) => e.kind === 'npc')
          .map((e) => (
            <div key={e.id}>
              <div>
                <b>{e.name}</b>
                <span>{game.memory[e.id]?.join(' · ') || 'Not yet acquainted'}</span>
              </div>
              <span className="relationship">
                {(game.trust[e.id] ?? 0) > 0
                  ? 'Friendly'
                  : (game.trust[e.id] ?? 0) < 0
                    ? 'Offended'
                    : 'Neutral'}
              </span>
            </div>
          ))}
      </div>
      <div className="journal-discoveries">
        <h3>Small discoveries</h3>
        <p>
          {game.flags.includes('mouseStory')
            ? '✓ The Mouse’s history heard.'
            : '○ The Mouse has a history to tell.'}
        </p>
        <p>
          {game.flags.includes('prizesGiven')
            ? '✓ Prizes shared with the Dodo.'
            : '○ The Dodo has something to say about prizes.'}
        </p>
      </div>
    </section>
  );
}
function WorldMap({ game }: { game: GameState }) {
  const coords: Record<string, [number, number]> = {
    hall: [300, 230],
    landing: [85, 230],
    passage: [300, 75],
    pool: [515, 230],
    garden: [300, 390],
  };
  campaign.locations.forEach((l, i) => {
    if (!coords[l.id]) coords[l.id] = [70 + (i % 4) * 150, 75 + Math.floor(i / 4) * 100];
  });
  return (
    <section className="content-panel">
      <PanelTitle
        eyebrow="PLACES & PASSAGES"
        title="A little way into Wonderland"
        description="Your map fills in as you explore. Travel by typing a direction or a connected place."
      />
      <div className="map-canvas">
        <svg
          viewBox="0 0 600 470"
          role="img"
          aria-label={`World map. Current location: ${locationOf(game).name}. Rabbit-hole west of the hall, passage north, pool east, garden south.`}
        >
          <defs>
            <pattern id="map-grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r=".7" fill="#b0ac99" opacity=".45" />
            </pattern>
          </defs>
          <rect width="600" height="470" fill="url(#map-grid)" />
          {['landing', 'passage', 'pool', 'garden'].map((id) => (
            <line
              key={id}
              x1="300"
              y1="230"
              x2={coords[id][0]}
              y2={coords[id][1]}
              stroke="#c1bcab"
              strokeWidth="1.5"
              strokeDasharray={
                id === 'garden' && !game.flags.includes('doorUnlocked') ? '5 5' : undefined
              }
            />
          ))}
          {campaign.locations.map((l) => {
            const [x, y] = coords[l.id];
            const visited = game.visited.includes(l.id);
            const current = l.id === game.location;
            return (
              <g key={l.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={current ? 29 : 23}
                  fill={current ? '#365747' : visited ? '#e9e5d9' : '#efede5'}
                  stroke={current ? '#365747' : '#bcb9a9'}
                  strokeWidth="1.5"
                />
                {current ? (
                  <circle cx={x} cy={y} r="7" fill="#dcc391" />
                ) : (
                  <path
                    d={`M${x - 5} ${y + 5}V${y - 3}q0-9 5-9t5 9v8z`}
                    stroke="#8a8e7a"
                    fill="none"
                  />
                )}
                <text
                  x={x}
                  y={y + 48}
                  textAnchor="middle"
                  fill={visited ? '#334a3b' : '#8b8b7b'}
                  fontSize="14"
                  fontFamily="Georgia"
                >
                  {l.name}
                </text>
                <text
                  x={x}
                  y={y + 65}
                  textAnchor="middle"
                  fill="#8b8b7b"
                  fontSize="9"
                  letterSpacing="1.5"
                >
                  {current ? 'YOU ARE HERE' : visited ? 'DISCOVERED' : 'UNEXPLORED'}
                </text>
              </g>
            );
          })}
          <text x="550" y="55" fontSize="12" fill="#8c927d" fontFamily="Georgia">
            N
          </text>
          <path d="M555 65v30m-5-20l5-10 5 10" fill="none" stroke="#8c927d" />
        </svg>
      </div>
      <p className="map-footnote">
        <Compass size={15} />
        {game.visited.length} of {campaign.locations.length} places discovered{' '}
        <span>Not to scale. Few things here are.</span>
      </p>
    </section>
  );
}
function Guide({ onCredits }: { onCredits: () => void }) {
  return (
    <section className="content-panel">
      <PanelTitle
        eyebrow="THE FIELD GUIDE"
        title="Begin with your own words"
        description="There is no list of choices. Describe one thing you want Alice to do, and the world will respond."
      />
      <div className="guide-block">
        <Feather size={22} />
        <div>
          <h3>Be curious. Be specific.</h3>
          <p>
            Mention a person, object, or place you can see. You can examine things, search your
            surroundings, collect items, use what you carry, and talk to people about a topic.
          </p>
          <p>
            Different words can mean the same thing: “examine” and “look at” both inspect an object.
            The parser understands one action at a time.
          </p>
        </div>
      </div>
      <div className="guide-block">
        <Compass size={22} />
        <div>
          <h3>Let the world answer.</h3>
          <p>
            Type “look” to review your surroundings and exits, “inventory” to see what you carry, or
            “journal” for your progress. Movement works with a direction or a connected location
            name.
          </p>
          <p>
            If something is out of reach, consider what else could change. Characters remember
            conversations; your size changes what you can do.
          </p>
        </div>
      </div>
      <div className="guide-block">
        <Bookmark size={22} />
        <div>
          <h3>Leave a bookmark.</h3>
          <p>
            Progress autosaves in this browser. “Save” keeps a manual checkpoint; “load” returns to
            it. Export a save from Saved games to carry it to another device.
          </p>
        </div>
      </div>
      <div className="guide-source">
        <Sparkles size={20} />
        <div>
          <h3>Literature, brought into play.</h3>
          <p>
            Story text comes from Lewis Carroll’s public-domain novel. A deterministic engine
            connects the passages to your actions.
          </p>
          <button className="text-link" onClick={onCredits}>
            Read the chapter credits <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
