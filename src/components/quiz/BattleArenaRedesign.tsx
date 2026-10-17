import React from "react";
import {
  Swords, Users, Trophy, ShieldCheck, Crown, Brain, ArrowUpRight,
  Zap, LockKeyhole, Target, Sparkles, ChevronRight, CircleDot,
  GraduationCap, Flame, Crosshair
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./BattleArenaRedesign.css";

export type BattleArenaSubjectOption = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: string;
  available: boolean;
};

export type BattleArenaRedesignProps = {
  playerName?: string;
  level?: number;
  currentXp?: number;
  nextLevelXp?: number;
  selectedSubject?: string;
  subjects?: BattleArenaSubjectOption[];
  onSubjectChange?: (subject: string) => void;
  /** Connect this to the existing Unranked Practice route/handler. */
  onUnrankedPractice?: () => void;
};

const upcomingModes = [
  { number: "01", title: "Quick match", description: "Get paired for a fast, focused face-off.", Icon: Users },
  { number: "02", title: "Challenge a friend", description: "Put your concepts to the test together.", Icon: Trophy },
  { number: "03", title: "Private room", description: "Bring your own study circle into the arena.", Icon: ShieldCheck },
  { number: "04", title: "Ranked battle", description: "Climb the ladder one correct answer at a time.", Icon: Crown },
];

export default function BattleArenaRedesign({
  playerName = "Player",
  level = 3,
  currentXp = 235,
  nextLevelXp = 250,
  selectedSubject,
  subjects = [],
  onSubjectChange,
  onUnrankedPractice,
}: BattleArenaRedesignProps) {
  const safeNextXp = Math.max(1, nextLevelXp);
  const safeCurrentXp = Math.max(0, currentXp);
  const progress = Math.max(0, Math.min(100, (safeCurrentXp / safeNextXp) * 100));
  const remainingXp = Math.max(0, safeNextXp - safeCurrentXp);
  const initial = playerName.trim().charAt(0).toUpperCase() || "P";

  return (
    <main className="jph-arena" aria-labelledby="jph-arena-title">
      <div className="jph-arena__glow jph-arena__glow--gold" aria-hidden="true" />
      <div className="jph-arena__glow jph-arena__glow--blue" aria-hidden="true" />

      <header className="jph-arena__topbar">
        <div className="jph-arena__brand">
          <span className="jph-arena__brand-mark"><Swords size={17} /></span>
          <span>
            <strong>PREPWIAN</strong>
            <small>COMPETITIVE ARENA</small>
          </span>
        </div>
        <div className="jph-arena__identity" title={playerName}>
          <span className="jph-arena__avatar">{initial}</span>
          <span className="jph-arena__identity-copy">
            <strong>{playerName}</strong>
            <small><span className="jph-arena__online-dot" /> LEVEL {level}</small>
          </span>
        </div>
      </header>

      <section className="jph-arena__hero">
        <div className="jph-arena__hero-copy">
          <div className="jph-arena__eyebrow"><span /> THE NEXT QUESTION CHANGES EVERYTHING</div>
          <h1 id="jph-arena-title">Earn your<br /><em>edge.</em></h1>
          <p>Practice with purpose. Master the concepts. Make every answer count.</p>
          <div className="jph-arena__hero-tags">
            <span><Crosshair size={14} /> Concept-first practice</span>
            <span><Flame size={14} /> Built for aspirants</span>
          </div>
        </div>
        <div className="jph-arena__crest" aria-hidden="true">
          <div className="jph-arena__crest-orbit jph-arena__crest-orbit--one" />
          <div className="jph-arena__crest-orbit jph-arena__crest-orbit--two" />
          <div className="jph-arena__crest-shield"><Swords size={43} strokeWidth={1.45} /></div>
          <span className="jph-arena__crest-star jph-arena__crest-star--a">✦</span>
          <span className="jph-arena__crest-star jph-arena__crest-star--b">✧</span>
          <span className="jph-arena__crest-caption">FOCUS · SKILL · PROGRESS</span>
        </div>
      </section>

      <section className="jph-arena__progress" aria-label="Player progression">
        <div className="jph-arena__progress-head">
          <div className="jph-arena__progress-title">
            <span className="jph-arena__section-kicker">YOUR JOURNEY</span>
            <strong>Level {level} <span className="jph-arena__arrow">↗</span> Level {level + 1}</strong>
          </div>
          <div className="jph-arena__xp"><b>{safeCurrentXp}</b><span> / {safeNextXp} XP</span></div>
        </div>
        <div className="jph-arena__progress-track" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={safeNextXp} aria-valuenow={Math.min(safeCurrentXp, safeNextXp)}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="jph-arena__progress-foot">
          <span>{remainingXp === 0 ? "Level-up milestone reached" : `${remainingXp} XP to your next level`}</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
      </section>

      <section className="jph-arena__modes" aria-labelledby="jph-arena-modes-title">
        <div className="jph-arena__section-head">
          <div>
            <span className="jph-arena__section-kicker">PICK YOUR PLAYSTYLE</span>
            <h2 id="jph-arena-modes-title">Choose your arena</h2>
          </div>
          <span className="jph-arena__mode-count"><Sparkles size={13} /> 05 MODES</span>
        </div>

        {subjects.length > 0 && (
          <div className="jph-arena__subject-filter" aria-label="Filter practice questions by subject">
            <span className="jph-arena__subject-label">SUBJECT</span>
            <div className="jph-arena__subject-options">
              {subjects.map(({ key, label, icon: Icon, tone, available }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!available}
                  aria-pressed={selectedSubject === key}
                  onClick={() => available && onSubjectChange?.(key)}
                  className={`jph-arena__subject-option ${selectedSubject === key ? "is-selected" : ""} ${!available ? "is-unavailable" : ""}`}
                >
                  <Icon size={14} className={tone} aria-hidden="true" />
                  {label}
                  {!available && <LockKeyhole size={11} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="jph-arena__grid">
          {upcomingModes.map(({ number, title, description, Icon }) => (
            <article className="jph-arena__mode jph-arena__mode--locked" key={number}>
              <div className="jph-arena__mode-head">
                <span className="jph-arena__mode-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <span className="jph-arena__locked"><LockKeyhole size={10} /> COMING SOON</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="jph-arena__mode-foot">
                <span>{number}</span><span>Not unlocked yet</span>
              </div>
            </article>
          ))}

          <button
            className="jph-arena__practice"
            type="button"
            onClick={onUnrankedPractice}
            disabled={!onUnrankedPractice}
          >
            <div className="jph-arena__practice-head">
              <span className="jph-arena__practice-icon"><Brain size={22} /></span>
              <span className="jph-arena__available"><CircleDot size={11} /> AVAILABLE NOW</span>
            </div>
            <div className="jph-arena__practice-copy">
              <span className="jph-arena__section-kicker">TRAIN AT YOUR OWN PACE</span>
              <h3>Unranked practice</h3>
              <p>Build accuracy using the question bank, without the pressure of a ranking.</p>
            </div>
            <div className="jph-arena__practice-cta">
              <span>Enter practice <ArrowUpRight size={17} /></span>
              <span className="jph-arena__practice-side">NO RANK. ALL PROGRESS.</span>
            </div>
            <div className="jph-arena__practice-watermark" aria-hidden="true"><GraduationCap size={112} /></div>
          </button>
        </div>
      </section>

      <footer className="jph-arena__footer">
        <span className="jph-arena__footer-icon"><ShieldCheck size={17} /></span>
        <p><strong>Progress over pressure.</strong> Every session is a chance to understand one more thing.</p>
        <ChevronRight size={17} />
      </footer>
    </main>
  );
}
