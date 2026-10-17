// ============================================================
// JEE PREP HUB — WATCH PARTY
// Premium Liquid Glass / Lens Watch Player v2
// File: src/features/watch-party/components/WatchPartyPlayer.tsx
// ============================================================

import {
  Check,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DRIFT_TOLERANCE_SECONDS,
  WATCH_PLAYBACK_RATES,
} from "../constants";
import type { WatchSyncStatus } from "../types";
import {
  useYoutubeIframe,
  type YoutubePlayer,
} from "../hooks/useYoutubeIframe";
import { PlayerOverlay } from "./PlayerOverlay";
import { SyncStatusPill } from "./SyncStatusPill";

type WatchPartyPlayerProps = {
  videoId: string;
  title: string;
  isHost: boolean;
  syncStatus: WatchSyncStatus;

  onPlay: () => Promise<void>;
  onPause: () => Promise<void>;
  onSeek: (seconds: number) => Promise<void>;
  onRateChange: (rate: number) => Promise<void>;

  onReady?: (player: YoutubePlayer) => void;
  onTimestamp?: (seconds: number) => void;
  onRequestSync: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(
        remaining,
      ).padStart(2, "0")}`
    : `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function WatchPartyPlayer({
  videoId,
  title,
  isHost,
  syncStatus,
  onPlay,
  onPause,
  onSeek,
  onRateChange,
  onReady,
  onTimestamp,
  onRequestSync,
}: WatchPartyPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const isDraggingRef = useRef(false);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedTimestamp, setCopiedTimestamp] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleReady = useCallback(
    (player: YoutubePlayer) => {
      playerRef.current = player;
      setPlayerError(null);

      const durationValue = player.getDuration();

      if (Number.isFinite(durationValue)) {
        setDuration(durationValue);
      }

      setPlaybackRate(player.getPlaybackRate() || 1);
      onReady?.(player);
    },
    [onReady],
  );

  const handleStateChange = useCallback((state: number) => {
    if (state === 1) {
      setIsPlaying(true);
    }

    if (state === 2) {
      setIsPlaying(false);
    }
  }, []);

  const handleLocalRateChange = useCallback((rate: number) => {
    if (Number.isFinite(rate)) {
      setPlaybackRate(rate);
    }
  }, []);

  const handlePlayerError = useCallback((error: number) => {
    const messages: Record<number, string> = {
      2: "The video ID or request parameters are invalid.",
      5: "The video could not be played in the HTML5 player.",
      100: "This video is unavailable or has been removed.",
      101: "The video owner does not allow embedded playback.",
      150: "The video owner does not allow embedded playback.",
    };

    setPlayerError(
      messages[error] ?? "YouTube could not play this video.",
    );
  }, []);

  useYoutubeIframe({
    containerRef,
    videoId,
    onReady: handleReady,
    onStateChange: handleStateChange,
    onPlaybackRateChange: handleLocalRateChange,
    onError: handlePlayerError,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;

      if (!player || isDraggingRef.current) {
        return;
      }

      const time = player.getCurrentTime();
      const playerDuration = player.getDuration();

      if (Number.isFinite(time)) {
        setCurrentTime(time);
      }

      if (
        Number.isFinite(playerDuration) &&
        playerDuration > 0
      ) {
        setDuration(playerDuration);
      }
    }, 400);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);

    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }

    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3200);
    }
  }, [isPlaying]);

  useEffect(() => {
    revealControls();
  }, [isPlaying, revealControls]);

  async function handlePlayPause() {
    if (!isHost) {
      onRequestSync();
      revealControls();
      return;
    }

    if (isPlaying) {
      await onPause();
    } else {
      await onPlay();
    }

    revealControls();
  }

  async function handleSeek(value: number) {
    if (!isHost) {
      return;
    }

    setCurrentTime(value);
    await onSeek(value);
    revealControls();
  }

  async function handleRateChange(value: number) {
    if (!isHost) {
      return;
    }

    setPlaybackRate(value);
    await onRateChange(value);
  }

  function handleShareTimestamp() {
    onTimestamp?.(currentTime);

    try {
      const url = new URL(window.location.href);
      url.hash = `t=${Math.floor(currentTime)}`;

      if (navigator.clipboard) {
        void navigator.clipboard
          .writeText(url.toString())
          .then(() => {
            setCopiedTimestamp(true);

            window.setTimeout(() => {
              setCopiedTimestamp(false);
            }, 1600);
          })
          .catch(() => undefined);
      }
    } catch {
      // The callback above remains available.
    }
  }

  async function handleFullscreen() {
    const container =
      containerRef.current?.parentElement;

    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }

  function handleMuteToggle() {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    try {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch {
      // Embedded player may reject commands in some states.
    }

    revealControls();
  }

  async function handleSyncClick() {
    setSyncing(true);
    onRequestSync();

    const player = playerRef.current;

    try {
      if (player) {
        player.playVideo();
      }
    } catch {
      // Authoritative sync remains handled by the sync hook.
    }

    window.setTimeout(() => {
      setSyncing(false);
    }, 700);

    revealControls();
  }

  const progress =
    duration > 0
      ? Math.min(
          100,
          Math.max(0, (currentTime / duration) * 100),
        )
      : 0;

  const isConnected =
    syncStatus === "connected" ||
    syncStatus === "synced";

  const drifted =
    duration > 0 &&
    currentTime > duration + DRIFT_TOLERANCE_SECONDS;

  return (
    <section
      className="jph-watch-player-v2"
      aria-label={`Watch party player: ${title}`}
    >
      <style>{`
        .jph-watch-player-v2 {
          --jph-glass: rgba(7,11,20,.76);
          --jph-line: rgba(255,255,255,.105);
          --jph-blue: rgba(120,134,255,.96);

          position: relative;
          isolation: isolate;

          width: 100%;
          overflow: hidden;

          border: 1px solid var(--jph-line);
          border-radius: 27px;

          background:
            radial-gradient(
              circle at 14% -10%,
              rgba(255,255,255,.105),
              transparent 30%
            ),
            radial-gradient(
              circle at 94% 115%,
              rgba(80,96,255,.14),
              transparent 38%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.055),
              rgba(255,255,255,.015)
            ),
            #050812;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.15),
            inset 0 -1px 0 rgba(0,0,0,.38),
            0 26px 75px rgba(0,0,0,.36),
            0 6px 20px rgba(0,0,0,.22);

          backdrop-filter:
            blur(24px)
            saturate(175%);

          -webkit-backdrop-filter:
            blur(24px)
            saturate(175%);
        }

        .jph-v2-stage {
          position: relative;
          overflow: hidden;

          aspect-ratio: 16 / 9;

          background:
            radial-gradient(
              ellipse at 50% 35%,
              rgba(61,75,155,.12),
              transparent 58%
            ),
            #000;
        }

        .jph-v2-stage::before {
          content: "";

          position: absolute;
          z-index: 2;
          inset: 0;

          pointer-events: none;

          background:
            linear-gradient(
              180deg,
              rgba(0,0,0,.36),
              transparent 23%,
              transparent 65%,
              rgba(0,0,0,.64)
            );
        }

        .jph-v2-stage::after {
          content: "";

          position: absolute;
          z-index: 3;

          left: 6%;
          top: 0;

          width: 42%;
          height: 1px;

          pointer-events: none;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.64),
              rgba(150,164,255,.28),
              transparent
            );

          opacity: .7;
        }

        .jph-v2-youtube {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .jph-v2-youtube iframe {
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }

        .jph-v2-top {
          position: absolute;
          z-index: 8;

          top: 10px;
          left: 10px;
          right: 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          pointer-events: none;
        }

        .jph-v2-pill {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          display: inline-flex;
          align-items: center;
          gap: 6px;

          min-height: 30px;
          padding: 5px 9px;

          border: 1px solid rgba(255,255,255,.11);
          border-radius: 999px;

          color: rgba(240,243,255,.84);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.105),
              rgba(255,255,255,.025)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.16),
            0 8px 25px rgba(0,0,0,.27);

          backdrop-filter:
            blur(20px)
            saturate(180%);

          -webkit-backdrop-filter:
            blur(20px)
            saturate(180%);

          font-size: 8px;
          font-weight: 800;
          letter-spacing: .035em;
        }

        .jph-v2-live-dot,
        .jph-v2-online-dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;

          border-radius: 50%;
        }

        .jph-v2-live-dot {
          background: #ff4da9;

          box-shadow:
            0 0 0 3px rgba(255,77,169,.08),
            0 0 13px rgba(255,77,169,.72);

          animation:
            jph-v2-pulse 1.8s ease-in-out infinite;
        }

        .jph-v2-online-dot {
          background: #55e4a3;

          box-shadow:
            0 0 11px rgba(85,228,163,.70);
        }

        .jph-v2-online-dot.offline {
          background: #ff7d8e;

          box-shadow:
            0 0 11px rgba(255,125,142,.62);
        }

        @keyframes jph-v2-pulse {
          0%,100% { transform: scale(.88); opacity: .68; }
          50% { transform: scale(1.13); opacity: 1; }
        }

        .jph-v2-title {
          position: absolute;
          z-index: 8;

          left: 10px;
          bottom: 10px;

          max-width: min(72%, 650px);

          display: flex;
          align-items: center;
          gap: 7px;

          min-width: 0;

          padding: 7px 10px;

          border: 1px solid rgba(255,255,255,.10);
          border-radius: 13px;

          color: rgba(247,249,255,.90);

          background:
            linear-gradient(
              145deg,
              rgba(7,10,18,.68),
              rgba(255,255,255,.035)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            0 9px 28px rgba(0,0,0,.28);

          backdrop-filter:
            blur(20px)
            saturate(175%);

          -webkit-backdrop-filter:
            blur(20px)
            saturate(175%);
        }

        .jph-v2-title-text {
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 10px;
          font-weight: 720;
        }

        .jph-v2-host {
          flex-shrink: 0;

          padding: 3px 6px;

          border-radius: 999px;

          color: #ffd86b;
          background: rgba(255,197,63,.08);
          border: 1px solid rgba(255,210,95,.13);

          font-size: 6px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .jph-v2-controls {
          position: absolute;
          z-index: 9;

          left: 10px;
          right: 10px;
          bottom: 10px;

          display: flex;
          align-items: center;
          gap: 6px;

          opacity: 1;
          transform: translateY(0);

          transition:
            opacity 220ms ease,
            transform 220ms ease;
        }

        .jph-v2-controls.hidden {
          opacity: 0;
          transform: translateY(7px);
          pointer-events: none;
        }

        .jph-v2-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          width: 38px;
          height: 38px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border: 1px solid rgba(255,255,255,.115);
          border-radius: 13px;

          color: rgba(241,244,255,.86);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.105),
              rgba(255,255,255,.025)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.16),
            0 8px 25px rgba(0,0,0,.30);

          backdrop-filter:
            blur(20px)
            saturate(175%);

          -webkit-backdrop-filter:
            blur(20px)
            saturate(175%);

          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .jph-v2-button::before {
          content: "";

          position: absolute;
          inset: -75%;

          pointer-events: none;

          background:
            linear-gradient(
              110deg,
              transparent 38%,
              rgba(255,255,255,.18) 49%,
              transparent 61%
            );

          transform: translateX(-65%);

          transition:
            transform 520ms ease;
        }

        .jph-v2-button:hover::before {
          transform: translateX(65%);
        }

        .jph-v2-button:hover {
          border-color: rgba(255,255,255,.20);
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.14),
              rgba(255,255,255,.035)
            );
        }

        .jph-v2-button:active {
          transform: scale(.90);
        }

        .jph-v2-button:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 3px rgba(105,119,255,.14),
            inset 0 1px 0 rgba(255,255,255,.20);
        }

        .jph-v2-primary {
          width: 42px;
          height: 42px;

          border-color: rgba(145,157,255,.27);

          background:
            linear-gradient(
              145deg,
              rgba(116,130,255,.27),
              rgba(255,255,255,.045)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.19),
            0 8px 24px rgba(54,68,177,.25);
        }

        .jph-v2-progress {
          position: absolute;
          z-index: 10;

          left: 10px;
          right: 10px;
          bottom: 7px;

          height: 3px;

          border-radius: 999px;

          pointer-events: none;

          background: rgba(255,255,255,.11);

          box-shadow:
            inset 0 1px 2px rgba(0,0,0,.30);
        }

        .jph-v2-progress-fill {
          position: absolute;
          inset: 0 auto 0 0;

          width: 0;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              rgba(100,115,255,.84),
              rgba(178,185,255,1)
            );

          box-shadow:
            0 0 11px rgba(120,134,255,.42);
        }

        .jph-v2-error {
          position: absolute;
          z-index: 12;

          left: 50%;
          top: 50%;

          width: min(88%, 430px);

          transform: translate(-50%, -50%);

          padding: 16px;

          border: 1px solid rgba(255,116,140,.20);
          border-radius: 18px;

          color: rgba(255,229,235,.90);
          text-align: center;

          background:
            linear-gradient(
              145deg,
              rgba(80,18,34,.76),
              rgba(18,7,13,.84)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08),
            0 22px 55px rgba(0,0,0,.40);

          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);

          font-size: 12px;
          line-height: 1.5;
        }

        .jph-v2-sync-flash {
          position: absolute;
          z-index: 11;

          left: 50%;
          top: 50%;

          display: inline-flex;
          align-items: center;
          gap: 7px;

          transform: translate(-50%, -50%);

          padding: 9px 13px;

          border: 1px solid rgba(150,162,255,.25);
          border-radius: 999px;

          color: rgba(245,247,255,.93);

          background:
            linear-gradient(
              145deg,
              rgba(91,105,229,.22),
              rgba(255,255,255,.045)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.16),
            0 12px 32px rgba(0,0,0,.32);

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          font-size: 10px;
          font-weight: 800;

          animation: jph-v2-sync-in .7s ease both;
        }

        @keyframes jph-v2-sync-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(.88);
          }

          45% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.02);
          }

          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .jph-v2-info {
          position: relative;

          padding: 11px 12px 13px;

          border-top: 1px solid rgba(255,255,255,.07);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.025),
              rgba(255,255,255,.012)
            );
        }

        .jph-v2-info-row {
          display: flex;
          align-items: center;
          gap: 8px;

          min-width: 0;
        }

        .jph-v2-info-title {
          min-width: 0;
          flex: 1;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: rgba(248,250,255,.95);

          font-size: 12px;
          font-weight: 760;
          letter-spacing: -.012em;
        }

        .jph-v2-speed {
          height: 34px;

          padding: 0 8px;

          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;

          color: rgba(230,234,249,.80);

          background: rgba(255,255,255,.045);

          outline: none;

          font-size: 9px;
          font-weight: 750;
        }

        .jph-v2-speed:focus {
          border-color: rgba(134,148,255,.42);
        }

        .jph-v2-bottom-controls {
          display: flex;
          align-items: center;
          gap: 5px;

          margin-top: 8px;
        }

        .jph-v2-range-wrap {
          position: relative;

          height: 21px;
          margin-top: 6px;
        }

        .jph-v2-range-track {
          position: absolute;

          left: 0;
          right: 0;
          top: 50%;

          height: 4px;

          transform: translateY(-50%);

          border-radius: 999px;

          background: rgba(255,255,255,.10);
        }

        .jph-v2-range-fill {
          position: absolute;
          inset: 0 auto 0 0;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              rgba(99,114,255,.82),
              rgba(178,185,255,.98)
            );

          box-shadow:
            0 0 9px rgba(118,132,255,.34);
        }

        .jph-v2-range {
          position: absolute;
          inset: 0;

          width: 100%;

          appearance: none;
          background: transparent;

          cursor: pointer;
        }

        .jph-v2-range:disabled {
          cursor: not-allowed;
          opacity: .5;
        }

        .jph-v2-range::-webkit-slider-runnable-track {
          height: 21px;
          background: transparent;
        }

        .jph-v2-range::-webkit-slider-thumb {
          appearance: none;

          width: 13px;
          height: 13px;

          margin-top: 4px;

          border: 2px solid rgba(255,255,255,.95);
          border-radius: 50%;

          background: #8e9aff;

          box-shadow:
            0 0 0 3px rgba(119,132,255,.12),
            0 2px 9px rgba(0,0,0,.38);
        }

        .jph-v2-range::-moz-range-track {
          height: 21px;
          background: transparent;
        }

        .jph-v2-range::-moz-range-thumb {
          width: 10px;
          height: 10px;

          border: 2px solid rgba(255,255,255,.95);
          border-radius: 50%;

          background: #8e9aff;
        }

        .jph-v2-action {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          min-width: 35px;
          height: 35px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;

          padding: 0 8px;

          border: 1px solid rgba(255,255,255,.08);
          border-radius: 11px;

          color: rgba(217,224,244,.73);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.055),
              rgba(255,255,255,.018)
            );

          transition:
            transform 160ms ease,
            color 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .jph-v2-action:hover {
          color: rgba(247,249,255,.96);
          border-color: rgba(255,255,255,.15);
          background: rgba(255,255,255,.07);
        }

        .jph-v2-action:active {
          transform: scale(.92);
        }

        .jph-v2-action:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(105,119,255,.12);
        }

        .jph-v2-time {
          color: rgba(177,187,210,.62);

          font-size: 8px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .jph-v2-spacer {
          flex: 1;
          min-width: 3px;
        }

        .jph-v2-note {
          margin-top: 7px;

          color: rgba(150,161,187,.52);

          font-size: 8px;
          line-height: 1.45;
        }

        .jph-v2-note.warning {
          color: rgba(255,196,108,.76);
        }

        @media (min-width: 560px) {
          .jph-watch-player-v2 {
            border-radius: 29px;
          }

          .jph-v2-info {
            padding: 13px 15px 14px;
          }

          .jph-v2-info-title {
            font-size: 13px;
          }

          .jph-v2-time {
            font-size: 9px;
          }
        }

        @media (max-width: 480px) {
          .jph-watch-player-v2 {
            border-radius: 22px;
          }

          .jph-v2-top {
            top: 7px;
            left: 7px;
            right: 7px;
          }

          .jph-v2-pill {
            min-height: 27px;
            padding: 4px 7px;
            font-size: 7px;
          }

          .jph-v2-title {
            left: 7px;
            bottom: 8px;
            max-width: 75%;
            padding: 6px 8px;
          }

          .jph-v2-title-text {
            font-size: 9px;
          }

          .jph-v2-host {
            display: none;
          }

          .jph-v2-controls {
            left: 7px;
            right: 7px;
            bottom: 7px;
            gap: 4px;
          }

          .jph-v2-button {
            width: 35px;
            height: 35px;
            border-radius: 11px;
          }

          .jph-v2-primary {
            width: 39px;
            height: 39px;
          }

          .jph-v2-progress {
            left: 7px;
            right: 7px;
            bottom: 4px;
          }

          .jph-v2-info {
            padding: 10px 10px 11px;
          }

          .jph-v2-info-title {
            font-size: 11px;
          }

          .jph-v2-speed {
            height: 33px;
          }

          .jph-v2-action {
            min-width: 33px;
            height: 33px;
            padding: 0 7px;
          }
        }

        @media (max-width: 370px) {
          .jph-v2-action span {
            display: none;
          }

          .jph-v2-speed {
            max-width: 55px;
            padding: 0 6px;
          }

          .jph-v2-bottom-controls {
            gap: 3px;
          }

          .jph-v2-time {
            font-size: 7px;
          }

          .jph-v2-title {
            max-width: 72%;
          }

          .jph-v2-pill:last-child {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jph-v2-live-dot,
          .jph-v2-sync-flash {
            animation: none;
          }

          .jph-v2-button,
          .jph-v2-action,
          .jph-v2-controls {
            transition: none;
          }

          .jph-v2-button::before {
            transition: none;
          }
        }
      `}</style>

      <div
        className="jph-v2-stage"
        onMouseMove={revealControls}
        onTouchStart={revealControls}
        onClick={revealControls}
      >
        <div
          ref={containerRef}
          className="jph-v2-youtube"
        />

        <div className="jph-v2-top">
          <div className="jph-v2-pill">
            <span className="jph-v2-live-dot" />
            WATCH PARTY
          </div>

          <div className="jph-v2-pill">
            <span
              className={[
                "jph-v2-online-dot",
                !isConnected ? "offline" : "",
              ].join(" ")}
            />
            {isConnected ? "SYNCED" : "SYNC ISSUE"}
          </div>
        </div>

        <div className="jph-v2-title">
          <span
            className="jph-v2-title-text"
            title={title}
          >
            {title}
          </span>

          {isHost && (
            <span className="jph-v2-host">
              HOST
            </span>
          )}
        </div>

        <PlayerOverlay
          syncStatus={syncStatus}
          isPlaying={isPlaying}
          isHost={isHost}
          hasVideo={Boolean(videoId)}
          error={playerError}
          onRequestSync={handleSyncClick}
        />

        {playerError && (
          <div
            className="jph-v2-error"
            role="alert"
          >
            {playerError}
          </div>
        )}

        {syncing && (
          <div
            className="jph-v2-sync-flash"
            role="status"
            aria-live="polite"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Synchronizing…
          </div>
        )}

        <div
          className={[
            "jph-v2-controls",
            controlsVisible ? "" : "hidden",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => void handlePlayPause()}
            className="jph-v2-button jph-v2-primary"
            disabled={!videoId}
            aria-label={
              isHost
                ? isPlaying
                  ? "Pause video"
                  : "Play video"
                : "Sync playback"
            }
          >
            {isHost && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleMuteToggle}
            className="jph-v2-button"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          <span className="jph-v2-time">
            {formatTime(currentTime)}
            {" / "}
            {formatTime(duration)}
          </span>

          <span className="jph-v2-spacer" />

          <button
            type="button"
            onClick={handleShareTimestamp}
            className="jph-v2-button"
            title="Share timestamp"
            aria-label="Share timestamp"
          >
            {copiedTimestamp ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleSyncClick()}
            className="jph-v2-button"
            title="Synchronize playback"
            aria-label="Synchronize playback"
          >
            <RefreshCw
              className={[
                "h-3.5 w-3.5",
                syncing ? "animate-spin" : "",
              ].join(" ")}
            />
          </button>

          <button
            type="button"
            onClick={() => void handleFullscreen()}
            className="jph-v2-button"
            title="Fullscreen"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="jph-v2-progress">
          <div
            className="jph-v2-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="jph-v2-info">
        <div className="jph-v2-info-row">
          <p
            className="jph-v2-info-title"
            title={title}
          >
            {title}
          </p>

          <SyncStatusPill status={syncStatus} />
        </div>

        <div className="jph-v2-range-wrap">
          <div className="jph-v2-range-track">
            <div
              className="jph-v2-range-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(duration, 0)}
            step={0.1}
            value={Math.min(
              currentTime,
              Math.max(duration, 0),
            )}
            disabled={!isHost || duration <= 0}
            onPointerDown={() => {
              isDraggingRef.current = true;
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
            }}
            onPointerCancel={() => {
              isDraggingRef.current = false;
            }}
            onChange={(event) => {
              void handleSeek(Number(event.target.value));
            }}
            className="jph-v2-range"
            aria-label="Video progress"
          />
        </div>

        <div className="jph-v2-bottom-controls">
          <button
            type="button"
            onClick={() => void handlePlayPause()}
            className="jph-v2-action"
            disabled={!videoId}
            aria-label={
              isHost
                ? isPlaying
                  ? "Pause video"
                  : "Play video"
                : "Sync playback"
            }
          >
            {isHost && isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>
              {isHost
                ? isPlaying
                  ? "Pause"
                  : "Play"
                : "Sync"}
            </span>
          </button>

          <span className="jph-v2-time">
            {formatTime(currentTime)}
            {" / "}
            {formatTime(duration)}
          </span>

          <span className="jph-v2-spacer" />

          <select
            value={playbackRate}
            disabled={!isHost}
            onChange={(event) => {
              void handleRateChange(
                Number(event.target.value),
              );
            }}
            className="jph-v2-speed"
            aria-label="Playback speed"
          >
            {WATCH_PLAYBACK_RATES.map((rate) => (
              <option
                key={rate}
                value={rate}
              >
                {rate}×
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleShareTimestamp}
            className="jph-v2-action"
            title="Share current timestamp"
            aria-label="Share current timestamp"
          >
            {copiedTimestamp ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span>
              {copiedTimestamp ? "Copied" : "Time"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleSyncClick()}
            className="jph-v2-action"
            title="Synchronize playback"
            aria-label="Synchronize playback"
          >
            <RefreshCw
              className={[
                "h-3.5 w-3.5",
                syncing ? "animate-spin" : "",
              ].join(" ")}
            />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={() => void handleFullscreen()}
            className="jph-v2-action"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={
              isFullscreen
                ? "Exit fullscreen"
                : "Fullscreen"
            }
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isHost && (
          <p className="jph-v2-note">
            Playback is controlled by the host. Use Sync if
            your player falls behind.
          </p>
        )}

        {isHost && (
          <p className="jph-v2-note">
            Host controls are synchronized with everyone in
            the room.
          </p>
        )}

        {drifted && (
          <p className="jph-v2-note warning">
            Playback position needs synchronization.
          </p>
        )}
      </div>
    </section>
  );
}
