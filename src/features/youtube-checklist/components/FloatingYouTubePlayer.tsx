import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Maximize2,
  MessageCircle,
  Minimize2,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Send,
  SkipBack,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { aiChatCompletion } from "@/lib/ai-chat.functions";

import { useYouTubeChecklistPlayer } from "../hooks/useYouTubeChecklistPlayer";

type FloatingYouTubePlayerProps = {
  videoId: string;
  title: string;
  onClose: () => void;
  onVideoEnded?: () => void;
  onReady?: () => void;
  isCompleted?: boolean;
  onMarkComplete?: () => void | Promise<void>;
};

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function FloatingYouTubePlayer({
  videoId,
  title,
  onClose,
  onVideoEnded,
  onReady,
  isCompleted = false,
  onMarkComplete,
}: FloatingYouTubePlayerProps) {
  const playerDialogRef = useRef<HTMLElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTool, setActiveTool] = useState<"timer" | "notes" | "tutor">("timer");
  const [notes, setNotes] = useState("");
  const [notesLoadedForVideo, setNotesLoadedForVideo] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    setPlaybackRate: updatePlaybackRate,
  } = useYouTubeChecklistPlayer({
    videoId,
    enabled: Boolean(portalTarget),
    onEnded: onVideoEnded,
    onReady,
  });
  useEffect(() => setPortalTarget(document.body), []);
  useEffect(() => {
    try {
      setNotes(localStorage.getItem(`youtube-checklist:notes:${videoId}`) ?? "");
    } catch {
      setNotes("");
    }
    setNotesLoadedForVideo(videoId);
  }, [videoId]);
  useEffect(() => {
    if (notesLoadedForVideo !== videoId) return;
    try {
      localStorage.setItem(`youtube-checklist:notes:${videoId}`, notes);
    } catch {
      // Notes remain available for the current session if storage is unavailable.
    }
  }, [notes, notesLoadedForVideo, videoId]);
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        return Math.max(0, seconds - 1);
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);
  useEffect(() => {
    if (timerSeconds === 0) setTimerRunning(false);
  }, [timerSeconds]);

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsVideoFullscreen(document.fullscreenElement === playerDialogRef.current);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isTheaterMode) setIsTheaterMode(false);
        else onClose();
        return;
      }
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        if (isPlaying) pause();
        else play();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekTo(currentTime - 10);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekTo(currentTime + 10);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, isTheaterMode, isPlaying, onClose, pause, play, seekTo]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const wholeSeconds = Math.floor(seconds);
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds % 3600) / 60);
    const remaining = (wholeSeconds % 60).toString().padStart(2, "0");
    return hours
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${remaining}`
      : `${minutes}:${remaining}`;
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === playerDialogRef.current) {
        await document.exitFullscreen();
      } else {
        await playerDialogRef.current?.requestFullscreen();
      }
    } catch {
      // Fullscreen can be unavailable in embedded or restricted browsers.
    }
  };
  const toggleLandscape = async () => {
    if (!isVideoFullscreen) await toggleFullscreen();
    try {
      await screen.orientation?.lock("landscape");
    } catch {
      // Orientation lock is browser/device dependent; manual rotation remains available.
    }
  };
  const askTutor = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const question = aiQuestion.trim();
    if (!question || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      let config: {
        provider?: "groq" | "gemini" | "openai" | "custom";
        model?: string;
        baseUrl?: string;
      } = {};
      try {
        config = JSON.parse(localStorage.getItem("aichat:config:v1") ?? "{}");
      } catch {
        // Match AI Study Chat's default provider when no preferences are saved.
      }
      const result = await aiChatCompletion({
        data: {
          provider: config.provider ?? "gemini",
          model: config.model,
          baseUrl: config.baseUrl,
          messages: [
            {
              role: "user",
              content: `I'm studying the YouTube lecture "${title}". Current playback position: ${formatTime(currentTime)}. My notes so far: ${notes.trim().slice(-1800) || "none yet"}. Answer this question in the context of this study session: ${question}`,
            },
          ],
        },
      });
      setAiAnswer(result.ok ? result.content : result.error);
    } catch (error) {
      setAiAnswer(
        error instanceof Error ? error.message : "The AI tutor could not answer right now.",
      );
    } finally {
      setAiLoading(false);
      setAiQuestion("");
    }
  };
  const handleComplete = async () => {
    if (!onMarkComplete || isCompleting) return;
    try {
      setIsCompleting(true);
      await onMarkComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  if (!portalTarget) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 backdrop-blur-sm transition-colors sm:p-6 ${isTheaterMode ? "!bg-slate-950 !p-0" : "bg-slate-950/80"}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={playerDialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`YouTube study player: ${title}`}
        className={`flex max-h-[96dvh] w-full flex-col overflow-hidden border border-white/10 bg-slate-950 text-white shadow-2xl ${isVideoFullscreen ? "h-[100dvh] w-screen max-h-none max-w-none overflow-y-auto rounded-none" : isTheaterMode ? "h-full max-h-none max-w-none rounded-none" : "max-w-6xl rounded-2xl sm:rounded-3xl"}`}
      >
        <header className="flex min-w-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-slate-500"}`}
              />
              {isPlaying
                ? "Study session in progress"
                : isReady
                  ? "Paused · ready when you are"
                  : "Loading video…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTheaterMode((value) => !value)}
            aria-pressed={isTheaterMode}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            title="Dim the page and hide the checklist for distraction-free viewing"
          >
            {isTheaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isTheaterMode ? "Exit theater" : "Theater mode"}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video player"
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          className={`relative mx-auto w-full max-w-[min(100%,1400px)] bg-black ${isVideoFullscreen ? "max-h-[62dvh]" : ""}`}
          style={
            isVideoFullscreen
              ? {
                  width: "min(100vw, 110.2222dvh)",
                  maxHeight: "62dvh",
                }
              : undefined
          }
        >
          <div className="aspect-video w-full">
            <div ref={containerRef} className="h-full w-full" />
          </div>
        </div>

        <div className="overflow-y-auto border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex items-center justify-between gap-3 text-xs tabular-nums text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
              aria-label={`Video progress ${Math.round(progress)} percent`}
            >
              <div
                className="h-full rounded-full bg-sky-400 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!isReady}
              onClick={() => seekTo(currentTime - 10)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
              title="Back 10 seconds (←)"
            >
              <SkipBack className="h-4 w-4" />
              <span>10s</span>
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={isPlaying ? pause : play}
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={() => seekTo(currentTime + 10)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
              title="Forward 10 seconds (→)"
            >
              <span>10s</span>
              <SkipForward className="h-4 w-4" />
            </button>

            <label
              className="relative inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"
              title="Playback speed"
            >
              <Clock3 className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Playback speed</span>
              <select
                aria-label="Playback speed"
                value={playbackRate}
                disabled={!isReady}
                onChange={(event) => {
                  const rate = Number(event.target.value);
                  setPlaybackRate(rate);
                  updatePlaybackRate(rate);
                }}
                className="cursor-pointer appearance-none bg-transparent pr-4 outline-none disabled:opacity-40"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate} className="bg-slate-900">
                    {rate === 1 ? "Normal" : `${rate}×`}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5" />
            </label>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              title={isVideoFullscreen ? "Exit fullscreen" : "Fullscreen video with study tools"}
            >
              {isVideoFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isVideoFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </span>
            </button>
            {isVideoFullscreen && (
              <button
                type="button"
                onClick={() => void toggleLandscape()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                title="Lock device orientation to landscape when supported"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Landscape</span>
              </button>
            )}

            {onMarkComplete && (
              <button
                type="button"
                disabled={isCompleting || isCompleted}
                onClick={() => void handleComplete()}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isCompleted ? "bg-emerald-400/15 text-emerald-300" : "bg-white text-slate-950 hover:bg-slate-200"}`}
              >
                <Check className="h-4 w-4" />
                {isCompleting ? "Saving…" : isCompleted ? "Completed" : "Mark complete"}
              </button>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Keyboard: Space to play or pause · ← / → to skip 10 seconds · Esc to close
          </p>
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Study tools">
              {(
                [
                  ["timer", Timer, "Focus timer"],
                  ["notes", NotebookPen, "Lecture notes"],
                  ["tutor", Bot, "Ask AI tutor"],
                ] as const
              ).map(([tool, Icon, label]) => (
                <button
                  key={tool}
                  type="button"
                  role="tab"
                  aria-selected={activeTool === tool}
                  onClick={() => setActiveTool(tool)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${activeTool === tool ? "border-sky-400/50 bg-sky-400/10 text-sky-200" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            {activeTool === "timer" && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/5 p-3">
                <Timer className="h-5 w-5 text-sky-300" />
                <span className="min-w-20 font-mono text-xl font-bold tabular-nums">
                  {Math.floor(timerSeconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(timerSeconds % 60).toString().padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setTimerRunning((running) => !running)}
                  className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white hover:bg-sky-400"
                >
                  {timerRunning
                    ? "Pause timer"
                    : timerSeconds === 0
                      ? "Start again"
                      : "Start focus"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(25 * 60);
                  }}
                  aria-label="Reset 25 minute focus timer"
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-400">
                  25-minute focus session · continues in fullscreen
                </span>
              </div>
            )}
            {activeTool === "notes" && (
              <div className="mt-3">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={`Take notes for “${title}”…`}
                  aria-label="Lecture notes"
                  className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  Saved on this device · attached to this video
                </p>
              </div>
            )}
            {activeTool === "tutor" && (
              <div className="mt-3 rounded-xl bg-white/5 p-3">
                <p className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                  <MessageCircle className="h-4 w-4" /> Tutor context includes this lecture,
                  timestamp, and your notes.
                </p>
                <form onSubmit={(event) => void askTutor(event)} className="flex gap-2">
                  <input
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    placeholder="Ask about the concept you’re watching…"
                    aria-label="Ask the AI study tutor"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {aiLoading ? "Thinking…" : "Ask"}
                  </button>
                </form>
                {aiAnswer && (
                  <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-200">
                    {aiAnswer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>,
    portalTarget,
  );
}
