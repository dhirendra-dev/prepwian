import { ReactNode, useState } from "react";
import {
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  BookOpen,
  Star,
  Palette,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  HEADER_THEMES,
  getHeaderTheme,
  type HeaderThemeKey,
} from "@/lib/headerThemes";

export const glassBtnPrimary =
  "jg-btn jg-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 font-semibold disabled:opacity-60";

export const glassBtnSoft =
  "jg-soft jg-text jg-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 font-semibold disabled:opacity-60";

type Props = {
  theme?: string | null;
  isOwn?: boolean;
  avatar: ReactNode;
  nameRow: ReactNode;
  socials?: ReactNode;
  actions: ReactNode;
  posts: number;
  followers: number;
  following: number;
  onFollowers?: () => void;
  onFollowing?: () => void;
  classLabel: string;
  memberSince: string;
  xp?: number;
  bio?: ReactNode;
  statusText?: string;
  onThemeChange?: (key: HeaderThemeKey) => void;
};

const css = `
.jg-root{
  --jg-a:#2f7bff;
  --jg-a2:#1558e6;
  width:100%;
  max-width:100%;
  min-width:0;
}

.jg-glass{
  background:rgba(255,255,255,.55);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  backdrop-filter:blur(24px) saturate(180%);
  border:1px solid rgba(255,255,255,.65);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.85),
    0 10px 40px rgba(30,80,200,.12);
  position:relative;
}

.jg-glass::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,.7) 0%,
    rgba(255,255,255,0) 45%
  );
}

.jg-soft{
  background:rgba(255,255,255,.45);
  border:1px solid rgba(255,255,255,.6);
  -webkit-backdrop-filter:blur(16px);
  backdrop-filter:blur(16px);
}

.jg-text{
  color:#0f1b3d;
}

.jg-muted{
  color:#64748b;
}

.dark .jg-glass{
  background:rgba(15,23,42,.86);
  border-color:rgba(255,255,255,.12);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.12),
    0 10px 40px rgba(0,0,0,.4);
}

.dark .jg-glass::before{
  background:linear-gradient(
    135deg,
    rgba(255,255,255,.04),
    rgba(255,255,255,0) 45%
  );
}

.dark .jg-soft{
  background:rgba(15,23,42,.78);
  border-color:rgba(148,163,184,.26);
}

.jg-picker-backdrop{
  background:rgba(10,20,50,.45);
}

.dark .jg-picker-backdrop{
  background:rgba(2,6,23,.78);
}

.dark .jg-text{
  color:#f1f5f9;
}

.dark .jg-muted{
  color:#94a3b8;
}

.jg-btn{
  background:linear-gradient(
    135deg,
    var(--jg-a),
    var(--jg-a2)
  );
  color:#fff;
  box-shadow:
    0 8px 20px rgba(0,0,0,.22),
    inset 0 1px 0 rgba(255,255,255,.35);
}

.jg-press{
  transition:transform .15s ease;
}

.jg-press:active{
  transform:scale(.97);
}

@keyframes jg-up{
  from{
    opacity:0;
    transform:translateY(12px);
  }
  to{
    opacity:1;
    transform:none;
  }
}

.jg-in{
  animation:jg-up .5s ease both;
}

/* Cover quote */
.jg-cover-quote{
  position:absolute;
  z-index:30;
  top:16px;
  right:18px;
  width:min(58%,430px);
  max-width:58%;
  text-align:right;
  color:rgba(255,255,255,.98);
  font-size:clamp(1.15rem,2.6vw,1.85rem);
  line-height:1.28;
  font-weight:800;
  font-style:italic;
  letter-spacing:-.02em;
  text-shadow:
    0 2px 10px rgba(0,20,70,.28),
    0 1px 2px rgba(0,0,0,.18);
  pointer-events:none;
  user-select:none;
}

.jg-cover-quote-line{
  display:block;
}

.jg-cover-quote-line + .jg-cover-quote-line{
  margin-top:3px;
}

/* Keep the cover content above decorative layers */
.jg-cover-content{
  position:absolute;
  inset:0;
  z-index:20;
  pointer-events:none;
}

/* Mobile */
@media (max-width:640px){
  .jg-cover-quote{
    top:14px;
    right:14px;
    width:62%;
    max-width:62%;
    font-size:clamp(1rem,5vw,1.35rem);
    line-height:1.25;
    text-shadow:
      0 2px 8px rgba(0,20,70,.32),
      0 1px 2px rgba(0,0,0,.18);
  }

  .jg-cover-quote-line + .jg-cover-quote-line{
    margin-top:2px;
  }
}

@media (max-width:380px){
  .jg-cover-quote{
    top:12px;
    right:12px;
    width:65%;
    max-width:65%;
    font-size:1rem;
  }
}

/* Better mobile identity layout */
.jg-profile-top{
  min-width:0;
}

.jg-name-area{
  min-width:0;
  overflow:hidden;
}

.jg-name-row{
  min-width:0;
  max-width:100%;
}

.jg-name-row > *{
  min-width:0;
  max-width:100%;
}

.jg-social-row{
  min-width:0;
  max-width:100%;
  overflow:hidden;
}

/* Mobile stats */
@media (max-width:480px){
  .jg-stat-number{
    font-size:1.65rem !important;
  }

  .jg-stat-label{
    font-size:.9rem !important;
  }
}

/* Mobile information row */
.jg-info-row{
  min-width:0;
}

.jg-info-item{
  min-width:0;
}

@media (max-width:480px){
  .jg-info-row{
    justify-content:space-between;
  }

  .jg-info-item{
    font-size:.82rem;
  }

  .jg-info-item span{
    min-width:0;
  }
}

/* Status */
.jg-status{
  min-width:0;
}

.jg-status-content{
  min-width:0;
}

.jg-status-text{
  overflow-wrap:anywhere;
}

/* Chips */
.jg-chip-row{
  scrollbar-width:none;
  -ms-overflow-style:none;
}

.jg-chip-row::-webkit-scrollbar{
  display:none;
}

@media (prefers-reduced-motion:reduce){
  .jg-in{
    animation:none;
  }

  .jg-press{
    transition:none;
  }
}

@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .jg-glass{
    background:rgba(255,255,255,.92);
  }

  .dark .jg-glass{
    background:rgba(20,28,48,.95);
  }
}
`;

export default function ProfileHeaderGlass(p: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const key = (
    Object.keys(HEADER_THEMES).includes(p.theme ?? "")
      ? p.theme
      : "default"
  ) as HeaderThemeKey;

  const t = getHeaderTheme(key);

  const days = Math.floor(
    (Date.now() - new Date(p.memberSince).getTime()) / 86400000
  );

  const since = new Date(p.memberSince).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="jg-root relative overflow-hidden pb-2"
      style={{
        ["--jg-a" as any]: t.accent,
        ["--jg-a2" as any]: t.accent2,
      }}
    >
      <style>{css}</style>

      {/* Background decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-16 h-64 w-64 rounded-full"
        style={{
          background: `radial-gradient(circle,rgba(${t.orb1},.35),transparent 70%)`,
          filter: "blur(30px)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute top-80 -right-20 h-72 w-72 rounded-full"
        style={{
          background: `radial-gradient(circle,rgba(${t.orb2},.25),transparent 70%)`,
          filter: "blur(36px)",
        }}
      />

      {/* =========================================================
          COVER
         ========================================================= */}
      <div
        className="jg-in relative h-36 w-full overflow-hidden rounded-3xl sm:h-44"
        style={{
          background: t.cover,
          boxShadow: "0 10px 30px rgba(0,0,0,.18)",
        }}
      >
        {/* Cover gradient */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to top,rgba(10,20,50,.3),transparent 60%)",
          }}
        />

        {/* RESTORED COVER QUOTE */}
        <div className="jg-cover-content">
          <div className="jg-cover-quote">
            <span className="jg-cover-quote-line">
              Discipline Today
            </span>
            <span className="jg-cover-quote-line">
              Better Tomorrow
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN PROFILE CARD
         ========================================================= */}
      <div
        className="jg-glass jg-in relative z-20 -mt-12 rounded-3xl p-4"
        style={{ animationDelay: ".06s" }}
      >
        {/* Profile identity */}
        <div className="jg-profile-top flex min-w-0 items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="-mt-14 shrink-0">
            <div
              className="rounded-full p-1"
              style={{
                background: "rgba(255,255,255,.85)",
                boxShadow:
                  "0 8px 28px rgba(0,0,0,.2),0 0 0 4px rgba(255,255,255,.4)",
              }}
            >
              {p.avatar}
            </div>
          </div>

          {/* Name + socials */}
          <div className="jg-name-area min-w-0 flex-1 pt-1">
            <div className="jg-name-row jg-text flex min-w-0 max-w-full flex-wrap items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              {p.nameRow}
            </div>

            {p.socials && (
              <div className="jg-social-row mt-2">
                {p.socials}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex min-w-0 flex-wrap gap-2">
          {p.actions}
        </div>

        {/* =====================================================
            STATS
           ===================================================== */}
        <div className="mt-4 grid grid-cols-3 text-center">
          {[
            {
              n: p.posts,
              l: "posts",
              f: undefined as undefined | (() => void),
            },
            {
              n: p.followers,
              l: "followers",
              f: p.onFollowers,
            },
            {
              n: p.following,
              l: "following",
              f: p.onFollowing,
            },
          ].map((s, i) => (
            <button
              key={s.l}
              type="button"
              onClick={s.f}
              disabled={!s.f}
              className="jg-press min-h-[56px] min-w-0 py-1"
              style={
                i > 0
                  ? {
                      borderLeft:
                        "1px solid rgba(100,116,139,.22)",
                    }
                  : undefined
              }
            >
              <div className="jg-text jg-stat-number text-2xl font-extrabold leading-none">
                {s.n}
              </div>

              <div className="jg-muted jg-stat-label mt-1 text-base">
                {s.l}
              </div>
            </button>
          ))}
        </div>

        {/* =====================================================
            CLASS / MEMBER SINCE
           ===================================================== */}
        <div className="jg-soft jg-info-row mt-3 flex min-w-0 items-center justify-around gap-2 rounded-2xl px-3 py-3 text-sm">
          <span className="jg-text jg-info-item flex min-w-0 items-center gap-2 font-semibold">
            <GraduationCap
              size={20}
              color={t.accent}
              className="shrink-0"
            />
            <span className="truncate">
              {p.classLabel}
            </span>
          </span>

          <span className="jg-text jg-info-item flex min-w-0 items-center gap-2 font-semibold">
            <CalendarDays
              size={20}
              color={t.accent}
              className="shrink-0"
            />
            <span className="truncate">
              Member since {since}
            </span>
          </span>
        </div>

        {typeof p.xp === "number" && (
          <div className="jg-soft jg-text mt-3 flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
            <span className="font-semibold">XP points</span>
            <span className="font-extrabold" style={{ color: t.accent }}>
              {p.xp.toLocaleString()} XP
            </span>
          </div>
        )}

        {/* =====================================================
            ACCOUNT STATUS
           ===================================================== */}
        {p.isOwn && (
          <div
            className="jg-status mt-3 flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(34,197,94,.12)",
              border: "1px solid rgba(34,197,94,.25)",
            }}
          >
            <ShieldCheck
              size={30}
              color="#16a34a"
              className="shrink-0"
            />

            <div className="jg-status-content min-w-0">
              <div className="jg-text text-sm font-bold">
                Account status
              </div>

              <div
                className="jg-status-text font-semibold"
                style={{ color: "#16a34a" }}
              >
                {p.statusText ?? "Active — No restrictions"}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            BIO
           ===================================================== */}
        <div className="jg-text mt-3 min-w-0 text-base">
          {p.bio}
        </div>

        {/* =====================================================
            BADGES / CHIPS
           ===================================================== */}
        <div
          className="jg-chip-row -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <Chip
            icon={
              <BookOpen
                size={20}
                color={t.accent}
              />
            }
            tint="rgba(120,120,120,.12)"
            title={`${
              p.classLabel === "Dropper"
                ? "JEE"
                : "JEE"
            } Aspirant`}
            sub="Study Identity"
          />

          <Chip
            icon={
              <Star
                size={20}
                color="#f59e0b"
                fill="#f59e0b"
              />
            }
            tint="rgba(245,158,11,.14)"
            title={
              days < 30
                ? "New Member"
                : "Community Member"
            }
            sub="Community Badge"
          />

          <Chip
            icon={
              <Palette
                size={20}
                color="#9333ea"
              />
            }
            tint="rgba(147,51,234,.12)"
            title={t.label}
            sub="Theme"
            onClick={
              p.isOwn
                ? () => setPickerOpen(true)
                : undefined
            }
            arrow={!!p.isOwn}
          />
        </div>
      </div>

      {/* =========================================================
          THEME PICKER
         ========================================================= */}
      {pickerOpen && p.isOwn && (
        <div
          className="jg-picker-backdrop fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setPickerOpen(false)}
          style={{
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="jg-glass w-full max-w-md rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jg-text mb-1 text-lg font-extrabold">
              Profile theme
            </div>

            <div className="jg-muted mb-4 text-sm">
              Everyone who visits your profile will see this look.
            </div>

            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(
                HEADER_THEMES
              ) as HeaderThemeKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="jg-press flex flex-col items-center gap-1"
                  onClick={() => {
                    p.onThemeChange?.(k);
                    setPickerOpen(false);
                  }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background:
                        HEADER_THEMES[k].cover,
                      border:
                        k === key
                          ? "3px solid #fff"
                          : "2px solid rgba(255,255,255,.5)",
                      boxShadow:
                        k === key
                          ? `0 0 0 2px ${HEADER_THEMES[k].accent}`
                          : "none",
                    }}
                  >
                    {k === key && (
                      <Check
                        size={20}
                        color="#fff"
                      />
                    )}
                  </span>

                  <span className="jg-text text-[11px] font-semibold">
                    {HEADER_THEMES[k].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip(props: {
  icon: ReactNode;
  tint: string;
  title: string;
  sub: string;
  onClick?: () => void;
  arrow?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={!props.onClick}
      className="jg-soft jg-press flex min-h-[56px] shrink-0 items-center gap-3 rounded-2xl px-3 text-left"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: props.tint }}
      >
        {props.icon}
      </span>

      <span className="min-w-0">
        <span className="jg-text block text-sm font-bold">
          {props.title}
        </span>

        <span className="jg-muted block text-xs">
          {props.sub}
        </span>
      </span>

      {props.arrow && (
        <ChevronRight
          size={18}
          className="jg-muted shrink-0"
        />
      )}
    </button>
  );
            }
