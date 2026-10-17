// @ts-nocheck

 import { useCallback, useEffect, useRef, useState } from "react";

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (
    seconds: number,
    allowSeekAhead?: boolean,
  ) => void;
  setPlaybackRate: (
    suggestedRate: number,
  ) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayer;
  data?: number;
};

type YouTubePlayerConstructor = new (
  element: HTMLElement,
  options: {
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (
        event: YouTubePlayerEvent,
      ) => void;
      onStateChange?: (
        event: YouTubePlayerEvent,
      ) => void;
      onError?: (
        event: YouTubePlayerEvent,
      ) => void;
    };
  },
) => YouTubePlayer;

type YouTubeApi = {
  Player: YouTubePlayerConstructor;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type UseYouTubeChecklistPlayerOptions = {
  videoId: string;
  enabled?: boolean;
  onEnded?: () => void;
  onReady?: () => void;
  onError?: (errorCode: number) => void;
};

type UseYouTubeChecklistPlayerReturn = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  getPlayer: () => YouTubePlayer | null;
};

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>(
    (resolve, reject) => {
      const existingScript =
        document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        );

      if (existingScript) {
        const previousCallback =
          window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady =
          () => {
            previousCallback?.();
            resolve();
          };

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      script.async = true;

      script.onerror = () => {
        youtubeApiPromise = null;
        reject(
          new Error(
            "Failed to load the YouTube Player API.",
          ),
        );
      };

      window.onYouTubeIframeAPIReady =
        () => resolve();

      document.head.appendChild(script);
    },
  );

  return youtubeApiPromise;
}

export function useYouTubeChecklistPlayer({
  videoId,
  enabled = true,
  onEnded,
  onReady,
  onError,
}: UseYouTubeChecklistPlayerOptions): UseYouTubeChecklistPlayerReturn {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const playerRef =
    useRef<YouTubePlayer | null>(null);

  const [isReady, setIsReady] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const onEndedRef =
    useRef(onEnded);

  const onReadyRef =
    useRef(onReady);

  const onErrorRef =
    useRef(onError);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;

    const createPlayer = async () => {
      if (!enabled || !containerRef.current) {
        return;
      }

      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors.
        }

        playerRef.current = null;
      }

      try {
        await loadYouTubeApi();

        if (
          cancelled ||
          !containerRef.current ||
          !window.YT?.Player
        ) {
          return;
        }

        const player =
          new window.YT.Player(
            containerRef.current,
            {
              videoId,
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                playsinline: 1,
              },
              events: {
                onReady: (event) => {
                  if (cancelled) {
                    return;
                  }

                  playerRef.current =
                    event.target;

                  setIsReady(true);

                  setDuration(
                    event.target.getDuration(),
                  );

                  onReadyRef.current?.();
                },

                onStateChange: (event) => {
                  if (cancelled) {
                    return;
                  }

                  const state =
                    event.data;

                  setIsPlaying(
                    state ===
                      window.YT!
                        .PlayerState
                        .PLAYING,
                  );

                  if (
                    state ===
                    window.YT!
                      .PlayerState
                      .ENDED
                  ) {
                    setIsPlaying(false);
                    onEndedRef.current?.();
                  }
                },

                onError: (event) => {
                  if (cancelled) {
                    return;
                  }

                  onErrorRef.current?.(
                    event.data ?? -1,
                  );
                },
              },
            },
          );

        playerRef.current = player;
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to create YouTube player:",
            error,
          );
        }
      }
    };

    void createPlayer();

    return () => {
      cancelled = true;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors.
        }

        playerRef.current = null;
      }
    };
  }, [enabled, videoId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;

      if (!player || !isReady) {
        return;
      }

      try {
        setCurrentTime(
          player.getCurrentTime(),
        );

        setDuration(
          player.getDuration(),
        );
      } catch {
        // Player may be transitioning between states.
      }
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isReady]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      playerRef.current?.seekTo(
        Math.max(0, seconds),
        true,
      );
    },
    [],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      playerRef.current?.setPlaybackRate(
        rate,
      );
    },
    [],
  );

  const getPlayer = useCallback(
    () => playerRef.current,
    [],
  );

  return {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    setPlaybackRate,
    getPlayer,
  };
}
