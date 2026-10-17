// ============================================================
// JEE PREP HUB — WATCH PARTY
// Premium Liquid Glass / Lens Mobile Navigation v3
// File: src/features/watch-party/components/MobilePartyTabs.tsx
// ============================================================

import {
  Info,
  ListVideo,
  MessageCircle,
  Users,
} from "lucide-react";

export type MobilePartyTab =
  | "chat"
  | "participants"
  | "queue"
  | "details";

type MobilePartyTabsProps = {
  activeTab: MobilePartyTab;
  onTabChange: (tab: MobilePartyTab) => void;
  participantCount?: number;
  queueCount?: number;
  unreadMessages?: number;
};

export function MobilePartyTabs({
  activeTab,
  onTabChange,
  participantCount = 0,
  queueCount = 0,
  unreadMessages = 0,
}: MobilePartyTabsProps) {
  const tabs = [
    {
      id: "chat" as const,
      label: "Chat",
      icon: MessageCircle,
      badge: unreadMessages,
      badgeLabel: "unread messages",
    },
    {
      id: "participants" as const,
      label: "People",
      icon: Users,
      badge: participantCount,
      badgeLabel: "participants",
    },
    {
      id: "queue" as const,
      label: "Queue",
      icon: ListVideo,
      badge: queueCount,
      badgeLabel: "queue items",
    },
    {
      id: "details" as const,
      label: "Details",
      icon: Info,
      badge: 0,
      badgeLabel: "",
    },
  ];

  return (
    <>
      <style>{`
        .jph-party-tabs {
          --dock-bg: rgba(6, 10, 19, .72);
          --dock-border: rgba(255,255,255,.105);
          --active-line: rgba(151,161,255,.42);

          position: relative;
          z-index: 40;

          width: calc(100% - 14px);
          max-width: 660px;

          margin: 8px auto 11px;
          padding: 5px;

          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4px;

          border: 1px solid var(--dock-border);
          border-radius: 25px;

          background:
            radial-gradient(
              115% 150% at 7% -50%,
              rgba(255,255,255,.14),
              transparent 34%
            ),
            radial-gradient(
              100% 135% at 102% 135%,
              rgba(83,101,255,.15),
              transparent 43%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.018)
            ),
            var(--dock-bg);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.17),
            inset 0 -1px 0 rgba(0,0,0,.25),
            0 22px 60px rgba(0,0,0,.34),
            0 5px 18px rgba(0,0,0,.20);

          backdrop-filter:
            blur(32px)
            saturate(190%);

          -webkit-backdrop-filter:
            blur(32px)
            saturate(190%);
        }

        .jph-party-tabs::before {
          content: "";

          position: absolute;
          top: 0;
          left: 9%;
          width: 60%;
          height: 1px;

          pointer-events: none;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.82),
              rgba(164,174,255,.30),
              transparent
            );

          opacity: .72;
        }

        .jph-party-tabs::after {
          content: "";

          position: absolute;
          inset: 0;

          pointer-events: none;
          border-radius: inherit;

          background:
            linear-gradient(
              115deg,
              rgba(255,255,255,.05),
              transparent 26%,
              transparent 68%,
              rgba(255,255,255,.025)
            );
        }

        .jph-party-tab {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          min-width: 0;
          min-height: 54px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;

          padding: 6px 3px;

          border: 1px solid transparent;
          border-radius: 18px;

          color: rgba(188,197,219,.55);
          background: transparent;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;

          transform: translateY(0);

          transition:
            transform 220ms cubic-bezier(.2,.85,.2,1),
            color 180ms ease,
            background 200ms ease,
            border-color 200ms ease,
            box-shadow 220ms ease;
        }

        /* Glass reflection */
        .jph-party-tab::before {
          content: "";

          position: absolute;
          inset: -80%;

          pointer-events: none;

          background:
            linear-gradient(
              112deg,
              transparent 35%,
              rgba(255,255,255,.19) 47%,
              rgba(255,255,255,.035) 52%,
              transparent 64%
            );

          transform: translateX(-72%);
          transition:
            transform 650ms cubic-bezier(.2,.7,.2,1);
        }

        .jph-party-tab:hover::before {
          transform: translateX(72%);
        }

        .jph-party-tab:hover {
          color: rgba(238,241,255,.90);
          background: rgba(255,255,255,.035);
        }

        /* Native-like press */
        .jph-party-tab:active {
          transform: translateY(1px) scale(.92);
        }

        .jph-party-tab:focus-visible {
          outline: none;

          border-color:
            rgba(138,151,255,.68);

          box-shadow:
            0 0 0 3px rgba(105,119,255,.13),
            inset 0 1px 0 rgba(255,255,255,.16);
        }

        /* Active lens */
        .jph-party-tab[data-active="true"] {
          color: rgba(246,248,255,.99);

          border-color:
            rgba(145,156,255,.23);

          background:
            radial-gradient(
              100% 125% at 50% -25%,
              rgba(164,174,255,.25),
              transparent 59%
            ),
            radial-gradient(
              90% 120% at 50% 120%,
              rgba(72,87,210,.10),
              transparent 62%
            ),
            linear-gradient(
              145deg,
              rgba(120,134,255,.15),
              rgba(255,255,255,.025)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.20),
            inset 0 -1px 0 rgba(0,0,0,.16),
            0 8px 25px rgba(63,76,185,.17);
        }

        .jph-party-tab[data-active="true"]::before {
          transform: translateX(18%);
          opacity: .78;
        }

        /* Active lens top edge */
        .jph-party-tab[data-active="true"] .jph-tab-edge {
          opacity: 1;
          transform: translateX(-50%) scaleX(1);
        }

        .jph-tab-edge {
          position: absolute;

          left: 50%;
          top: 0;

          width: 48%;
          height: 1px;

          transform:
            translateX(-50%)
            scaleX(.35);

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(194,200,255,.82),
              transparent
            );

          box-shadow:
            0 0 8px rgba(141,153,255,.40);

          opacity: 0;

          transition:
            opacity 220ms ease,
            transform 260ms cubic-bezier(.2,.8,.2,1);
        }

        /* Active bottom indicator */
        .jph-party-tab[data-active="true"] .jph-tab-indicator {
          opacity: 1;
          width: 25px;
        }

        .jph-tab-indicator {
          position: absolute;

          left: 50%;
          bottom: 3px;

          width: 6px;
          height: 2px;

          transform: translateX(-50%);

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              rgba(104,118,255,.05),
              rgba(177,185,255,1),
              rgba(104,118,255,.05)
            );

          box-shadow:
            0 0 6px rgba(128,141,255,.62),
            0 0 14px rgba(128,141,255,.24);

          opacity: .35;

          transition:
            width 250ms cubic-bezier(.2,.8,.2,1),
            opacity 180ms ease;
        }

        .jph-party-tab__icon-wrap {
          position: relative;
          z-index: 3;

          width: 28px;
          height: 25px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          transition:
            transform 220ms cubic-bezier(.2,.85,.2,1),
            background 200ms ease,
            box-shadow 200ms ease;
        }

        .jph-party-tab[data-active="true"]
          .jph-party-tab__icon-wrap {
          transform: translateY(-1px) scale(1.035);

          background:
            radial-gradient(
              circle,
              rgba(143,153,255,.19),
              transparent 72%
            );

          box-shadow:
            0 5px 15px rgba(86,99,215,.12);
        }

        .jph-party-tab__icon {
          width: 18px;
          height: 18px;

          stroke-width: 1.85;

          filter:
            drop-shadow(
              0 2px 7px rgba(0,0,0,.25)
            );

          transition:
            transform 220ms cubic-bezier(.2,.85,.2,1),
            filter 200ms ease;
        }

        .jph-party-tab[data-active="true"]
          .jph-party-tab__icon {
          transform: scale(1.07);

          filter:
            drop-shadow(
              0 0 8px rgba(137,149,255,.36)
            );
        }

        .jph-party-tab__label {
          position: relative;
          z-index: 3;

          max-width: 100%;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 9px;
          line-height: 1;
          font-weight: 720;
          letter-spacing: .01em;
        }

        /* Floating count badge */
        .jph-party-tab__badge {
          position: absolute;
          z-index: 6;

          top: 2px;
          left: calc(50% + 7px);

          min-width: 16px;
          height: 16px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0 4px;

          border-radius: 999px;

          color: rgba(255,255,255,.99);

          background:
            linear-gradient(
              145deg,
              rgba(132,144,255,.99),
              rgba(67,82,204,.97)
            );

          border: 1px solid rgba(255,255,255,.25);

          box-shadow:
            0 4px 13px rgba(43,54,165,.42),
            inset 0 1px 0 rgba(255,255,255,.31);

          font-size: 7px;
          line-height: 1;
          font-weight: 900;

          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .jph-party-tab[data-active="true"]
          .jph-party-tab__badge {
          transform: scale(1.05);

          box-shadow:
            0 4px 16px rgba(76,91,210,.50),
            inset 0 1px 0 rgba(255,255,255,.35);
        }

        /* Unread chat gets a restrained pulse */
        .jph-party-tab[data-unread="true"]
          .jph-party-tab__badge {
          animation:
            jph-chat-badge-pulse 2.5s ease-in-out infinite;
        }

        @keyframes jph-chat-badge-pulse {
          0%, 68%, 100% {
            transform: scale(1);
            box-shadow:
              0 4px 13px rgba(43,54,165,.42),
              inset 0 1px 0 rgba(255,255,255,.31);
          }

          76% {
            transform: scale(1.10);
            box-shadow:
              0 5px 19px rgba(83,97,225,.54),
              0 0 0 3px rgba(117,130,255,.06),
              inset 0 1px 0 rgba(255,255,255,.35);
          }

          84% {
            transform: scale(.99);
          }
        }

        /* Touch ripple/glow */
        .jph-party-tab__touch-glow {
          position: absolute;
          z-index: 1;

          width: 72px;
          height: 72px;

          left: 50%;
          top: 50%;

          transform: translate(-50%, -50%);

          border-radius: 50%;

          pointer-events: none;

          background:
            radial-gradient(
              circle,
              rgba(137,150,255,.13),
              transparent 68%
            );

          opacity: 0;

          transition:
            opacity 180ms ease;
        }

        .jph-party-tab:active
          .jph-party-tab__touch-glow {
          opacity: 1;
        }

        @media (min-width: 480px) {
          .jph-party-tabs {
            width: calc(100% - 24px);
            margin-top: 10px;
            margin-bottom: 13px;
            padding: 6px;
            gap: 5px;
          }

          .jph-party-tab {
            min-height: 57px;
            border-radius: 19px;
          }

          .jph-party-tab__label {
            font-size: 10px;
          }
        }

        @media (min-width: 640px) {
          .jph-party-tabs {
            max-width: 620px;
          }
        }

        @media (min-width: 1024px) {
          .jph-party-tabs {
            display: none;
          }
        }

        @media (max-width: 350px) {
          .jph-party-tabs {
            width: calc(100% - 10px);
            gap: 2px;
            padding: 4px;
            margin-top: 7px;
            margin-bottom: 9px;
            border-radius: 20px;
          }

          .jph-party-tab {
            min-height: 48px;
            padding: 5px 2px;
            border-radius: 15px;
          }

          .jph-party-tab__icon-wrap {
            width: 24px;
            height: 23px;
          }

          .jph-party-tab__icon {
            width: 16px;
            height: 16px;
          }

          .jph-party-tab__label {
            font-size: 8px;
          }

          .jph-party-tab__badge {
            left: calc(50% + 5px);
            top: 2px;
            min-width: 14px;
            height: 14px;
            padding: 0 3px;
            font-size: 6px;
          }

          .jph-tab-indicator {
            bottom: 2px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jph-party-tab,
          .jph-party-tab::before,
          .jph-party-tab__icon,
          .jph-party-tab__icon-wrap,
          .jph-party-tab__badge,
          .jph-tab-edge,
          .jph-tab-indicator {
            transition: none;
          }

          .jph-party-tab[data-unread="true"]
            .jph-party-tab__badge {
            animation: none;
          }
        }
      `}</style>

      <nav
        className="jph-party-tabs"
        aria-label="Watch Party sections"
        role="tablist"
      >
        {tabs.map(
          ({
            id,
            label,
            icon: Icon,
            badge,
            badgeLabel,
          }) => {
            const active = activeTab === id;
            const hasBadge = badge > 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-selected={active}
                aria-label={
                  hasBadge
                    ? `${label}, ${badge} ${badgeLabel}`
                    : label
                }
                role="tab"
                data-active={active}
                data-unread={
                  id === "chat" &&
                  unreadMessages > 0
                }
                className="jph-party-tab"
              >
                <span
                  className="jph-tab-edge"
                  aria-hidden="true"
                />

                <span
                  className="jph-party-tab__touch-glow"
                  aria-hidden="true"
                />

                <span className="jph-party-tab__icon-wrap">
                  <Icon
                    className="jph-party-tab__icon"
                    aria-hidden="true"
                  />

                  {hasBadge && (
                    <span
                      className="jph-party-tab__badge"
                      aria-hidden="true"
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>

                <span className="jph-party-tab__label">
                  {label}
                </span>

                <span
                  className="jph-tab-indicator"
                  aria-hidden="true"
                />
              </button>
            );
          },
        )}
      </nav>
    </>
  );
}
