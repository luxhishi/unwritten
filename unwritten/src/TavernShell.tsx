import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Feather,
  Flame,
  Menu,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import CharacterSheet from './CharacterSheet';
import { campaign, locationOf } from './engine/game';
import type { GameState } from './engine/types';
import './tavern-shell.css';

type Section = 'home' | 'library' | 'ongoing' | 'characters' | 'profile';
type Profile = { name: string; bio: string };
const profileKey = 'unwritten.profile.v1';
const sections: { id: Section; label: string; icon: typeof Flame; hash: string }[] = [
  { id: 'home', label: 'Tavern home', icon: Flame, hash: '#/' },
  { id: 'library', label: 'Story library', icon: BookOpen, hash: '#/library' },
  { id: 'ongoing', label: 'Ongoing stories', icon: Bookmark, hash: '#/ongoing' },
  { id: 'characters', label: 'Character sheets', icon: Shield, hash: '#/characters' },
  { id: 'profile', label: 'Profile', icon: UserRound, hash: '#/profile' },
];
function currentSection(): Section {
  return (
    sections.find((section) => section.hash === window.location.hash)?.id ??
    (window.location.hash === '#available-stories' ? 'library' : 'home')
  );
}
function readProfile(): Profile {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(profileKey) ?? 'null');
    if (
      data &&
      typeof data === 'object' &&
      'name' in data &&
      'bio' in data &&
      typeof data.name === 'string' &&
      typeof data.bio === 'string'
    ) {
      return { name: data.name.trim().slice(0, 40) || 'Traveler', bio: data.bio.slice(0, 160) };
    }
  } catch {
    /* A profile is optional; the game save is separate. */
  }
  return { name: 'Traveler', bio: '' };
}

export default function TavernShell({
  game,
  onOpenStory,
  children,
}: {
  game: GameState;
  onOpenStory: (id: string) => void;
  children: ReactNode;
}) {
  const [section, setSection] = useState<Section>(currentSection);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(readProfile);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [message, setMessage] = useState('');
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const hasProgress = game.entries.some((entry) => entry.kind === 'command');
  const completed = game.flags.includes(campaign.quests[0].completedFlag);
  const ongoingCount = hasProgress && !completed ? 1 : 0;
  const initial = Array.from(profile.name)[0]?.toLocaleUpperCase() ?? 'T';

  useEffect(() => {
    const onHashChange = () => {
      setSection(currentSection());
      setMenuOpen(false);
      setMessage('');
      window.scrollTo(0, 0);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('.tavern-nav-close')?.focus();
    const wideScreen = window.matchMedia('(min-width: 901px)');
    const closeOnWideScreen = () => {
      if (wideScreen.matches) setMenuOpen(false);
    };
    wideScreen.addEventListener('change', closeOnWideScreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      wideScreen.removeEventListener('change', closeOnWideScreen);
      toggleRef.current?.focus();
    };
  }, [menuOpen]);

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const next = { name: name.trim() || 'Traveler', bio: bio.trim() };
    try {
      localStorage.setItem(profileKey, JSON.stringify(next));
      setProfile(next);
      setName(next.name);
      setBio(next.bio);
      setMessage('Profile saved in this browser.');
    } catch {
      setMessage(
        'This browser could not save your profile. Please try again with browser storage enabled.',
      );
    }
  }

  return (
    <div className={`tavern-shell tavern-section-${section}`}>
      <div className="tavern-mobile-bar">
        <button
          ref={toggleRef}
          aria-label="Open tavern menu"
          aria-expanded={menuOpen}
          aria-controls="tavern-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={21} />
        </button>
        <a href="#/">UNWRITTEN</a>
        <a href="#/profile" aria-label="Your profile" className="tavern-mobile-avatar">
          {initial}
        </a>
      </div>
      {menuOpen && (
        <button
          className="tavern-menu-backdrop"
          aria-label="Close tavern menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        ref={menuRef}
        onKeyDown={(event) => {
          if (!menuOpen || event.key !== 'Tab') return;
          const controls = menuRef.current?.querySelectorAll<HTMLElement>('a, button');
          if (!controls?.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        className={`tavern-navigation ${menuOpen ? 'menu-open' : ''}`}
        id="tavern-navigation"
        aria-label="Tavern sidebar"
      >
        <a href="#/" className="brand tavern-nav-brand">
          <span className="brand-mark">
            <Feather size={24} />
          </span>
          <span>
            UNWRITTEN<small>THE STORY TAVERN</small>
          </span>
        </a>
        <button
          className="tavern-nav-close"
          aria-label="Close sidebar"
          onClick={() => setMenuOpen(false)}
        >
          <X size={19} />
        </button>
        <div className="tavern-nav-ornament">
          <span />✦<span />
        </div>
        <p className="tavern-nav-label">A PLACE FOR YOUR STORIES</p>
        <nav aria-label="Tavern navigation">
          {sections.map(({ id, label, icon: Icon, hash }) => (
            <a
              href={hash}
              key={id}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
              {id === 'ongoing' && <small>{ongoingCount}</small>}
              {id === 'characters' && <small>1</small>}
              {section === id && <span className="tavern-active-mark" />}
            </a>
          ))}
        </nav>
        {hasProgress && (
          <div className="tavern-resume">
            <span>
              <Bookmark size={13} /> YOUR BOOKMARK
            </span>
            <h2>The Wonderland Chapters</h2>
            <p>{completed ? 'Chapter completed' : locationOf(game).name}</p>
            <button onClick={() => onOpenStory(campaign.id)}>
              {completed ? 'Revisit story' : 'Continue reading'}
              <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="tavern-nav-bottom">
          <p>
            Every traveler has a story.
            <br />
            There’s a place here for yours.
          </p>
          <a href="#/profile" className="tavern-profile-link">
            <span className="tavern-profile-avatar">{initial}</span>
            <span>
              <strong>{profile.name}</strong>
              <small>Local profile</small>
            </span>
            <ArrowRight size={14} />
          </a>
          <span className="tavern-local-indicator">
            <span /> Saved on this device
          </span>
        </div>
      </aside>
      <div className="tavern-shell-content" inert={menuOpen}>
        {section === 'home' || section === 'library' ? (
          children
        ) : (
          <main className="tavern-account-page">
            <div className="tavern-account-heading">
              <span className="library-eyebrow">YOUR CORNER OF THE TAVERN</span>
              <h1>{sections.find((item) => item.id === section)?.label}</h1>
              <p>
                {section === 'profile'
                  ? 'The name you bring to the table. Your profile stays in this browser.'
                  : section === 'characters'
                    ? 'Your campaign characters, their belongings, and the marks left by your adventures.'
                    : 'Return to a story you have already begun.'}
              </p>
            </div>
            {section === 'profile' && (
              <section className="tavern-profile-card">
                <div className="tavern-profile-card-top">
                  <span className="tavern-profile-avatar">{initial}</span>
                  <div>
                    <h2>{profile.name}</h2>
                    <p>Local adventurer profile</p>
                  </div>
                </div>
                <form onSubmit={saveProfile}>
                  <label htmlFor="profile-name">Display name</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setMessage('');
                    }}
                    maxLength={40}
                    required
                  />
                  <label htmlFor="profile-bio">
                    About you <span>Optional · 160 characters</span>
                  </label>
                  <textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(event) => {
                      setBio(event.target.value);
                      setMessage('');
                    }}
                    maxLength={160}
                    rows={4}
                    placeholder="What brings you to the story tavern?"
                  />
                  <button className="primary-button" type="submit">
                    <Check size={15} />
                    Save profile
                  </button>
                  <p className="tavern-profile-notice" role="status">
                    {message ||
                      'No account or sign-in required. Your game save is stored separately.'}
                  </p>
                </form>
              </section>
            )}
            {section === 'characters' && (
              <div className="tavern-character-page">
                <div>
                  <CharacterSheet game={game} />
                </div>
                <section className="tavern-character-summary">
                  <span className="library-eyebrow">THE WONDERLAND CHAPTERS</span>
                  <h2>Alice</h2>
                  <p>One playable campaign character. This sheet follows your current save.</p>
                  <dl>
                    <div>
                      <dt>Current place</dt>
                      <dd>{locationOf(game).name}</dd>
                    </div>
                    <div>
                      <dt>Places discovered</dt>
                      <dd>
                        {game.visited.length} / {campaign.locations.length}
                      </dd>
                    </div>
                    <div>
                      <dt>Current turn</dt>
                      <dd>{game.turn}</dd>
                    </div>
                    <div>
                      <dt>Chapter</dt>
                      <dd>
                        {completed ? 'Completed' : hasProgress ? 'In progress' : 'Ready to begin'}
                      </dd>
                    </div>
                  </dl>
                  <button className="primary-button" onClick={() => onOpenStory(campaign.id)}>
                    {hasProgress ? 'Return to story' : 'Begin story'}
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
            )}
            {section === 'ongoing' &&
              (ongoingCount ? (
                <article className="tavern-ongoing-card">
                  <div className="tavern-ongoing-art" />
                  <div>
                    <span className="library-eyebrow">IN PROGRESS</span>
                    <h2>The Wonderland Chapters</h2>
                    <p>Alice · {locationOf(game).name}</p>
                    <div className="tavern-ongoing-progress">
                      <span
                        style={{
                          width: `${(game.visited.length / campaign.locations.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="tavern-progress-caption">
                      {game.visited.length} of {campaign.locations.length} places discovered · Turn{' '}
                      {game.turn}
                    </p>
                    <button className="primary-button" onClick={() => onOpenStory(campaign.id)}>
                      Continue story
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ) : (
                <section className="tavern-empty">
                  <Bookmark size={30} />
                  <h2>
                    {completed ? 'A chapter well traveled' : 'Your next adventure is waiting'}
                  </h2>
                  <p>
                    {completed
                      ? 'You have completed The Wonderland Chapters. You can revisit your story or browse the tavern board.'
                      : 'You haven’t started a story yet. Find a tale on the tavern board to begin.'}
                  </p>
                  <a className="primary-button" href="#/library">
                    Browse stories
                    <ArrowRight size={15} />
                  </a>
                  {completed && (
                    <button className="text-link" onClick={() => onOpenStory(campaign.id)}>
                      Revisit Wonderland
                    </button>
                  )}
                </section>
              ))}
          </main>
        )}
      </div>
    </div>
  );
}
