// src/features/party/PartyPlayer.tsx
// One player for YouTube, direct video files, Twitch and website embeds.
// YouTube and video files can be fully controlled (play / pause / seek).
// Twitch and website embeds are shown as-is (no remote control possible).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { twitchEmbedUrl, type ParsedSource } from "./partyLib";

export type PlayerHandle = {
  canSync: boolean;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  getTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  setMuted: (muted: boolean) => void;
  setVolume: (volume01: number) => void;
  setRate: (rate: number) => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

let ytPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (ytPromise) return ytPromise;

  ytPromise = new Promise((resolve) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      try {
        previous?.();
      } catch {
        /* ignore */
      }
      resolve(w.YT);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
  });
  return ytPromise;
}

type Props = {
  source: ParsedSource;
  onReady: (handle: PlayerHandle) => void;
  onTap?: () => void;
  onEnded?: () => void;
  onError?: (message: string) => void;
  children?: ReactNode;
};

export function PartyPlayer({
  source,
  onReady,
  onTap,
  onEnded,
  onError,
  children,
}: Props) {
  const ytWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [parentHost, setParentHost] = useState("");

  // Keep latest callbacks without re-creating the player.
  const onReadyRef = useRef(onReady);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;

  useEffect(() => {
    setParentHost(window.location.hostname);
  }, []);

  // Twitch / website: nothing to control, just report ready.
  useEffect(() => {
    if (source.type !== "twitch" && source.type !== "web") return;
    onReadyRef.current({
      canSync: false,
      play() {},
      pause() {},
      seek() {},
      getTime: () => 0,
      getDuration: () => 0,
      isPlaying: () => false,
      setMuted() {},
      setVolume() {},
      setRate() {},
    });
  }, [source.type, source.url]);

  // YouTube
  useEffect(() => {
    if (source.type !== "youtube" || !source.videoId || !ytWrapRef.current) {
      return;
    }
    let cancelled = false;
    let player: any = null;
    const mount = document.createElement("div");
    ytWrapRef.current.appendChild(mount);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(mount, {
        videoId: source.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            onReadyRef.current({
              canSync: true,
              play: () => player.playVideo(),
              pause: () => player.pauseVideo(),
              seek: (s) => player.seekTo(Math.max(0, s), true),
              getTime: () => Number(player.getCurrentTime?.()) || 0,
              getDuration: () => Number(player.getDuration?.()) || 0,
              isPlaying: () => {
                const st = player.getPlayerState?.();
                return st === 1 || st === 3;
              },
              setMuted: (m) => (m ? player.mute() : player.unMute()),
              setVolume: (v) => player.setVolume(Math.round(v * 100)),
              setRate: (r) => player.setPlaybackRate(r),
            });
          },
          onStateChange: (e: any) => {
            if (e?.data === 0) onEndedRef.current?.();
          },
          onError: () =>
            onErrorRef.current?.(
              "This video can't be played here. The owner may have blocked embedding.",
            ),
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {
        /* ignore */
      }
      mount.remove();
    };
  }, [source.type, source.videoId]);

  const handleVideoReady = () => {
    const v = videoRef.current;
    if (!v) return;
    onReadyRef.current({
      canSync: true,
      play: () => void v.play().catch(() => {}),
      pause: () => v.pause(),
      seek: (s) => {
        v.currentTime = Math.max(0, s);
      },
      getTime: () => v.currentTime || 0,
      getDuration: () => (Number.isFinite(v.duration) ? v.duration : 0),
      isPlaying: () => !v.paused && !v.ended,
      setMuted: (m) => {
        v.muted = m;
      },
      setVolume: (vol) => {
        v.volume = Math.min(1, Math.max(0, vol));
      },
      setRate: (r) => {
        v.playbackRate = r;
      },
    });
  };

  const canTap = source.type === "youtube" || source.type === "mp4";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
      {source.type === "youtube" && (
        <div
          ref={ytWrapRef}
          className="absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
        />
      )}

      {source.type === "mp4" && (
        <video
          ref={videoRef}
          key={source.url}
          src={source.url}
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain"
          onLoadedMetadata={handleVideoReady}
          onEnded={() => onEndedRef.current?.()}
          onError={() =>
            onErrorRef.current?.("This video file couldn't be loaded.")
          }
        />
      )}

      {source.type === "twitch" && parentHost && (
        <iframe
          title="Twitch"
          src={twitchEmbedUrl(source.url, parentHost) ?? undefined}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      )}

      {source.type === "web" && (
        <iframe
          title="Website"
          src={source.url}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0 bg-white"
        />
      )}

      {/* Tap layer: toggles play / pause, blocks the YouTube iframe's own clicks */}
      {canTap && (
        <button
          type="button"
          aria-label="Play or pause"
          onClick={onTap}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      )}

      {children}
    </div>
  );
}
