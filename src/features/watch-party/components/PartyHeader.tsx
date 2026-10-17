// ============================================================
// PREPWIAN — WATCH PARTY
// Premium Liquid Glass / Lens Header
// File: src/features/watch-party/components/PartyHeader.tsx
// ============================================================

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  LogOut,
  Radio,
  Share2,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import type {
  WatchRoom,
  WatchRoomMemberRole,
  WatchSyncStatus,
} from "../types";

import { SyncStatusPill } from "./SyncStatusPill";

type PartyHeaderProps = {
  room: WatchRoom;
  role?: WatchRoomMemberRole | null;
  syncStatus?: WatchSyncStatus;
  participantCount?: number;
  onBack?: () => void;
  onLeave?: () => void;
};

export function PartyHeader({
  room,
  role,
  syncStatus = "connected",
  participantCount = 0,
  onBack,
  onLeave,
}: PartyHeaderProps) {
  const [copied, setCopied] = useState(false);

  const isHost = role === "host";
  const isLive = room.status === "live";

  const isConnected =
    syncStatus === "connected" ||
    syncStatus === "synced";

  async function handleShareRoom() {
    const url = window.location.href;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: room.title,
          text: `Join my Watch Party — ${room.title}`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Sharing can be cancelled by the user.
    }
  }

  async function handleCopyRoomLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Clipboard access may be unavailable.
    }
  }

  const syncLabel = isConnected
    ? "Synced"
    : syncStatus === "connecting"
      ? "Connecting"
      : "Sync issue";

  return (
    <>
      <style>{`
        .jph-watch-header {
          --glass-bg: rgba(8, 12, 22, .70);
          --glass-line: rgba(255,255,255,.105);
          --glass-line-bright: rgba(255,255,255,.19);

          position: sticky;
          top: 0;
          z-index: 60;

          padding:
            max(9px, env(safe-area-inset-top))
            10px
            9px;

          background:
            linear-gradient(
              180deg,
              rgba(2,5,11,.94) 0%,
              rgba(2,5,11,.76) 65%,
              rgba(2,5,11,.25) 100%
            );

          backdrop-filter:
            blur(28px)
            saturate(165%);

          -webkit-backdrop-filter:
            blur(28px)
            saturate(165%);
        }

        .jph-watch-header__ambient {
          position: absolute;
          top: -70px;
          left: 50%;
          width: 420px;
          height: 180px;
          transform: translateX(-50%);
          pointer-events: none;
          background:
            radial-gradient(
              ellipse,
              rgba(103,91,255,.15),
              rgba(255,57,169,.055) 38%,
              transparent 72%
            );
          filter: blur(22px);
        }

        .jph-watch-header__shell {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          width: 100%;
          max-width: 1500px;
          min-height: 70px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px;

          border: 1px solid var(--glass-line);
          border-radius: 25px;

          background:
            radial-gradient(
              circle at 16% -15%,
              rgba(255,255,255,.13),
              transparent 31%
            ),
            radial-gradient(
              circle at 95% 115%,
              rgba(76,96,255,.11),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              rgba(255,255,255,.072),
              rgba(255,255,255,.025)
            ),
            var(--glass-bg);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.16),
            inset 0 -1px 0 rgba(255,255,255,.035),
            0 22px 65px rgba(0,0,0,.34),
            0 3px 14px rgba(0,0,0,.22);
        }

        .jph-watch-header__shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              115deg,
              rgba(255,255,255,.105),
              transparent 23%,
              transparent 60%,
              rgba(255,255,255,.035)
            );
          opacity: .85;
        }

        .jph-watch-header__shell::after {
          content: "";
          position: absolute;
          top: 0;
          left: 8%;
          width: 48%;
          height: 1px;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.66),
              rgba(165,176,255,.25),
              transparent
            );
          opacity: .62;
        }

        .jph-lens {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          border: 1px solid rgba(255,255,255,.105);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.10),
              rgba(255,255,255,.028)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.15),
            inset 0 -1px 0 rgba(0,0,0,.20),
            0 7px 22px rgba(0,0,0,.23);

          backdrop-filter:
            blur(20px)
            saturate(175%);

          -webkit-backdrop-filter:
            blur(20px)
            saturate(175%);

          transition:
            transform 180ms cubic-bezier(.2,.8,.2,1),
            background 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .jph-lens::before {
          content: "";
          position: absolute;
          inset: -55%;
          pointer-events: none;

          background:
            linear-gradient(
              112deg,
              transparent 35%,
              rgba(255,255,255,.18) 47%,
              rgba(255,255,255,.035) 52%,
              transparent 62%
            );

          transform: translateX(-65%);
          transition:
            transform 520ms cubic-bezier(.2,.7,.2,1);
        }

        .jph-lens:hover::before {
          transform: translateX(65%);
        }

        .jph-lens:hover {
          border-color: var(--glass-line-bright);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.21),
            inset 0 -1px 0 rgba(0,0,0,.15),
            0 10px 30px rgba(0,0,0,.30);
        }

        .jph-lens:active {
          transform: scale(.93);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.14),
              rgba(255,255,255,.035)
            );

          box-shadow:
            inset 0 2px 9px rgba(0,0,0,.28),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .jph-lens:focus-visible {
          outline: none;
          border-color: rgba(132,145,255,.70);

          box-shadow:
            0 0 0 3px rgba(105,119,255,.15),
            inset 0 1px 0 rgba(255,255,255,.20);
        }

        .jph-back {
          width: 44px;
          height: 44px;
          border-radius: 15px;
          color: rgba(238,242,255,.83);
        }

        .jph-room-mark {
          position: relative;
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;

          border: 1px solid rgba(140,155,255,.17);

          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(255,255,255,.22),
              transparent 34%
            ),
            radial-gradient(
              circle at 70% 80%,
              rgba(90,105,255,.18),
              transparent 52%
            ),
            linear-gradient(
              145deg,
              rgba(109,124,255,.25),
              rgba(34,42,79,.22)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.20),
            0 9px 25px rgba(55,70,180,.15);
        }

        .jph-room-mark::after {
          content: "";
          position: absolute;
          width: 7px;
          height: 7px;
          top: 7px;
          right: 7px;
          border-radius: 50%;
          background: #ff4eaa;

          box-shadow:
            0 0 0 3px rgba(255,78,170,.08),
            0 0 14px rgba(255,78,170,.62);
        }

        .jph-room-copy {
          min-width: 0;
          flex: 1;
          position: relative;
          z-index: 3;
        }

        .jph-room-title {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .jph-room-title h1 {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: rgba(255,255,255,.96);

          font-size: 14px;
          line-height: 1.15;
          font-weight: 780;
          letter-spacing: -.025em;
        }

        .jph-room-meta {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 6px;
          min-width: 0;
          margin-top: 5px;

          color: rgba(188,197,219,.62);

          font-size: 9px;
          font-weight: 650;
          letter-spacing: .015em;
        }

        .jph-subject {
          max-width: 115px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .jph-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          padding: 3px 7px;
          border-radius: 999px;

          color: #ff70b9;

          background:
            linear-gradient(
              135deg,
              rgba(255,70,166,.105),
              rgba(255,70,166,.035)
            );

          border: 1px solid rgba(255,91,177,.14);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.06),
            0 4px 16px rgba(255,30,140,.08);
        }

        .jph-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ff3fa5;

          box-shadow:
            0 0 0 3px rgba(255,63,165,.09),
            0 0 12px rgba(255,63,165,.75);

          animation:
            jph-live-pulse 1.8s ease-in-out infinite;
        }

        @keyframes jph-live-pulse {
          0%,100% {
            opacity: .65;
            transform: scale(.88);
          }
          50% {
            opacity: 1;
            transform: scale(1.14);
          }
        }

        .jph-host {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          padding: 3px 7px;
          border-radius: 999px;

          color: #ffd86b;

          background:
            linear-gradient(
              135deg,
              rgba(255,196,63,.12),
              rgba(255,196,63,.035)
            );

          border: 1px solid rgba(255,210,95,.15);

          font-size: 7px;
          font-weight: 850;
          letter-spacing: .09em;
        }

        .jph-actions {
          position: relative;
          z-index: 4;

          display: flex;
          align-items: center;
          gap: 6px;
        }

        .jph-action {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          color: rgba(226,232,255,.78);
        }

        .jph-share-active {
          color: #aeb8ff;
          border-color: rgba(134,148,255,.25);

          background:
            linear-gradient(
              145deg,
              rgba(113,128,255,.15),
              rgba(255,255,255,.035)
            );
        }

        .jph-copied {
          color: #65e8b0 !important;
          border-color: rgba(80,230,166,.22) !important;

          background:
            linear-gradient(
              145deg,
              rgba(68,220,155,.12),
              rgba(255,255,255,.03)
            ) !important;
        }

        .jph-people {
          display: none;
          align-items: center;
          gap: 7px;
          height: 42px;
          padding: 0 11px;
          border-radius: 14px;

          color: rgba(229,234,249,.76);

          font-size: 10px;
          font-weight: 700;
        }

        .jph-people-count {
          min-width: 20px;
          height: 20px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0 5px;
          border-radius: 999px;

          color: rgba(255,255,255,.95);
          background: rgba(255,255,255,.09);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.11);
        }

        .jph-sync-desktop {
          display: none;
        }

        .jph-mobile-status {
          position: relative;
          z-index: 3;

          display: flex;
          align-items: center;
          justify-content: space-between;

          max-width: 1500px;
          margin: 7px auto 0;
          padding: 0 5px;
        }

        .jph-online {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          color: rgba(181,191,214,.55);

          font-size: 9px;
          font-weight: 650;
        }

        .jph-online-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #55e4a3;

          box-shadow:
            0 0 9px rgba(85,228,163,.7);
        }

        .jph-offline-dot {
          background: #ff7788;

          box-shadow:
            0 0 9px rgba(255,119,136,.6);
        }

        .jph-sync-mini {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 4px 7px;
          border-radius: 999px;

          color: rgba(189,198,220,.66);

          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);

          font-size: 8px;
          font-weight: 700;
        }

        .jph-sync-mini svg {
          width: 10px;
          height: 10px;
        }

        @media (min-width: 560px) {
          .jph-watch-header {
            padding-left: 13px;
            padding-right: 13px;
          }

          .jph-watch-header__shell {
            min-height: 72px;
            padding: 10px;
          }

          .jph-room-title h1 {
            font-size: 15px;
          }

          .jph-room-meta {
            font-size: 10px;
          }
        }

        @media (min-width: 768px) {
          .jph-watch-header {
            padding-left: 18px;
            padding-right: 18px;
          }

          .jph-people {
            display: inline-flex;
          }

          .jph-sync-desktop {
            display: block;
          }

          .jph-mobile-status {
            display: none;
          }
        }

        @media (min-width: 1024px) {
          .jph-watch-header__shell {
            min-height: 76px;
            border-radius: 27px;
          }

          .jph-back,
          .jph-room-mark {
            width: 46px;
            height: 46px;
          }

          .jph-action {
            width: 44px;
            height: 44px;
          }
        }

        @media (max-width: 430px) {
          .jph-watch-header__shell {
            gap: 6px;
            min-height: 63px;
            padding: 7px;
            border-radius: 21px;
          }

          .jph-back,
          .jph-action {
            width: 39px;
            height: 39px;
            border-radius: 13px;
          }

          .jph-room-mark {
            display: none;
          }

          .jph-room-title h1 {
            font-size: 13px;
          }

          .jph-room-meta {
            margin-top: 3px;
            font-size: 8px;
          }

          .jph-subject {
            max-width: 85px;
          }

          .jph-host {
            display: none;
          }

          .jph-actions {
            gap: 4px;
          }
        }

        @media (max-width: 350px) {
          .jph-watch-header {
            padding-left: 7px;
            padding-right: 7px;
          }

          .jph-watch-header__shell {
            padding: 6px;
          }

          .jph-back,
          .jph-action {
            width: 36px;
            height: 36px;
          }

          .jph-room-title h1 {
            font-size: 12px;
          }

          .jph-room-meta {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jph-lens,
          .jph-lens::before {
            transition: none;
          }

          .jph-live-dot {
            animation: none;
          }
        }

        @media (pointer: coarse) {
          .jph-lens {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>

      <header className="jph-watch-header">
        <div
          className="jph-watch-header__ambient"
          aria-hidden="true"
        />

        <div className="jph-watch-header__shell">
          <button
            type="button"
            onClick={onBack}
            className="jph-lens jph-back"
            aria-label="Go back"
          >
            <ArrowLeft
              className="h-[19px] w-[19px]"
              aria-hidden="true"
            />
          </button>

          <div
            className="jph-room-mark"
            aria-hidden="true"
          >
            <Radio
              className="h-[18px] w-[18px] text-indigo-200"
            />
          </div>

          <div className="jph-room-copy">
            <div className="jph-room-title">
              <h1 title={room.title}>
                {room.title}
              </h1>

              {isHost && (
                <span className="jph-host">
                  HOST
                </span>
              )}
            </div>

            <div className="jph-room-meta">
              <span
                className="jph-subject capitalize"
                title={room.subject}
              >
                {room.subject}
              </span>

              <span aria-hidden="true">
                •
              </span>

              {isLive ? (
                <span className="jph-live">
                  <span className="jph-live-dot" />
                  LIVE
                </span>
              ) : (
                <span className="capitalize">
                  {room.status}
                </span>
              )}
            </div>
          </div>

          <div className="jph-lens jph-people">
            <Users
              className="h-[14px] w-[14px]"
              aria-hidden="true"
            />

            <span>Watching</span>

            <span className="jph-people-count">
              {participantCount}
            </span>
          </div>

          <div className="jph-actions">
            <div className="jph-sync-desktop">
              <SyncStatusPill status={syncStatus} />
            </div>

            <button
              type="button"
              onClick={() => void handleShareRoom()}
              className={[
                "jph-lens",
                "jph-action",
                copied ? "jph-copied" : "jph-share-active",
              ].join(" ")}
              aria-label={
                copied
                  ? "Room link copied"
                  : "Share watch party"
              }
              title={
                copied
                  ? "Copied"
                  : "Share watch party"
              }
            >
              {copied ? (
                <Check
                  className="h-[17px] w-[17px]"
                  aria-hidden="true"
                />
              ) : (
                <Share2
                  className="h-[17px] w-[17px]"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleCopyRoomLink()}
              className={[
                "jph-lens",
                "jph-action",
                "hidden sm:inline-flex",
                copied ? "jph-copied" : "",
              ].join(" ")}
              aria-label="Copy room link"
              title="Copy room link"
            >
              {copied ? (
                <Check
                  className="h-[16px] w-[16px]"
                  aria-hidden="true"
                />
              ) : (
                <Copy
                  className="h-[16px] w-[16px]"
                  aria-hidden="true"
                />
              )}
            </button>

            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="jph-lens jph-action"
                style={{
                  color: "rgba(255,151,171,.86)",
                }}
                aria-label="Leave watch party"
                title="Leave watch party"
              >
                <LogOut
                  className="h-[17px] w-[17px]"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        <div className="jph-mobile-status">
          <span className="jph-sync-mini">
            {isConnected ? (
              <Wifi />
            ) : (
              <WifiOff />
            )}

            {syncLabel}
          </span>

          <span className="jph-online">
            <span
              className={[
                "jph-online-dot",
                !isConnected ? "jph-offline-dot" : "",
              ].join(" ")}
            />

            {participantCount} online
          </span>
        </div>
      </header>
    </>
  );
}
