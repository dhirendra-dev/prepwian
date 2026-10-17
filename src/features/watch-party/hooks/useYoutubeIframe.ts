// ============================================================
// PREPWIAN — WATCH PARTY
// YouTube IFrame API hook
// File: src/features/watch-party/hooks/useYoutubeIframe.ts
// ============================================================

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

// ============================================================
// YouTube types
// ============================================================

export type YoutubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (
    seconds: number,
    allowSeekAhead?: boolean,
  ) => void;

  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;

  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  mute: () => void;
  unMute: () => void;

  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;

  destroy: () => void;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars?: Record<string, unknown>;

  events?: {
    onReady?: (event: {
      target: YoutubePlayer;
    }) => void;

    onStateChange?: (event: {
      target: YoutubePlayer;
      data: number;
    }) => void;

    onPlaybackRateChange?: (event: {
      target: YoutubePlayer;
      data: number;
    }) => void;

    onError?: (event: {
      target: YoutubePlayer;
      data: number;
    }) => void;
  };
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: YouTubePlayerOptions,
  ) => YoutubePlayer;
};

type YoutubeWindow = {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

function ytWindow(): YoutubeWindow {
  return window as unknown as YoutubeWindow;
}

// ============================================================
// API loader
// ============================================================

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYoutubeApi(): Promise<YouTubeApi> {
  if (ytWindow().YT?.Player) {
    return Promise.resolve(ytWindow().YT!);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const previousReady = ytWindow().onYouTubeIframeAPIReady;

    ytWindow().onYouTubeIframeAPIReady = () => {
      previousReady?.();

      if (ytWindow().YT?.Player) {
        resolve(ytWindow().YT!);
      } else {
        reject(
          new Error(
            "YouTube IFrame API loaded without YT.Player.",
          ),
        );
      }
    };

    if (existingScript) {
      const timeout = window.setTimeout(() => {
        if (ytWindow().YT?.Player) {
          resolve(ytWindow().YT!);
        } else {
          reject(
            new Error(
              "Timed out while loading YouTube IFrame API.",
            ),
          );
        }
      }, 10000);

      return () => window.clearTimeout(timeout);
    }

    const script = document.createElement("script");

    script.src =
      "https://www.youtube.com/iframe_api";

    script.async = true;

    script.onerror = () => {
      youtubeApiPromise = null;

      reject(
        new Error(
          "Unable to load YouTube IFrame API.",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

// ============================================================
// Hook
// ============================================================

type UseYoutubeIframeArgs = {
  containerRef: RefObject<HTMLDivElement | null>;

  videoId: string;

  onReady?: (player: YoutubePlayer) => void;

  onStateChange?: (
    state: number,
    player: YoutubePlayer,
  ) => void;

  onPlaybackRateChange?: (
    rate: number,
    player: YoutubePlayer,
  ) => void;

  onError?: (
    errorCode: number,
    player: YoutubePlayer,
  ) => void;
};

export function useYoutubeIframe({
  containerRef,
  videoId,
  onReady,
  onStateChange,
  onPlaybackRateChange,
  onError,
}: UseYoutubeIframeArgs) {
  const playerRef =
    useRef<YoutubePlayer | null>(null);

  const callbacksRef = useRef({
    onReady,
    onStateChange,
    onPlaybackRateChange,
    onError,
  });

  callbacksRef.current = {
    onReady,
    onStateChange,
    onPlaybackRateChange,
    onError,
  };

  const [isReady, setIsReady] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // Create player
  // ==========================================================

  useEffect(() => {
    let disposed = false;

    async function createPlayer() {
      if (!containerRef.current) {
        return;
      }

      try {
        const YT = await loadYoutubeApi();

        if (
          disposed ||
          !containerRef.current ||
          !YT?.Player
        ) {
          return;
        }

        const player = new YT.Player(
          containerRef.current,
          {
            videoId: videoId || "",

            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              enablejsapi: 1,
            },

            events: {
              onReady: (event) => {
                if (disposed) {
                  return;
                }

                playerRef.current =
                  event.target;

                setIsReady(true);
                setError(null);

                callbacksRef.current.onReady?.(
                  event.target,
                );
              },

              onStateChange: (event) => {
                if (disposed) {
                  return;
                }

                callbacksRef.current.onStateChange?.(
                  event.data,
                  event.target,
                );
              },

              onPlaybackRateChange: (event) => {
                if (disposed) {
                  return;
                }

                callbacksRef.current.onPlaybackRateChange?.(
                  event.data,
                  event.target,
                );
              },

              onError: (event) => {
                if (disposed) {
                  return;
                }

                setError(
                  `YouTube player error: ${event.data}`,
                );

                callbacksRef.current.onError?.(
                  event.data,
                  event.target,
                );
              },
            },
          },
        );

        playerRef.current = player;
      } catch (err) {
        if (disposed) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unable to initialize YouTube player.";

        setError(message);
      }
    }

    void createPlayer();

    return () => {
      disposed = true;

      const player = playerRef.current;

      playerRef.current = null;

      if (player) {
        try {
          player.destroy();
        } catch {
          // Player may already have been destroyed.
        }
      }

      setIsReady(false);
    };
  }, [containerRef]);

  // ==========================================================
  // Change video without recreating the player
  // ==========================================================

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const player = playerRef.current;

    if (!player || !videoId) {
      return;
    }

    try {
      player.loadVideoById(videoId);
    } catch {
      // The player can briefly be unavailable while
      // transitioning between iframe states.
    }
  }, [videoId, isReady]);

  // ==========================================================
  // Return player state
  // ==========================================================

  return {
    player: playerRef.current,
    playerRef,
    isReady,
    error,
  };
}