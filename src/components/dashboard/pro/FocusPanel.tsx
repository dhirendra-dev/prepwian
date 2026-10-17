// src/components/dashboard/pro/FocusPanel.tsx
// "Currently focused" status timer, live watch parties, and focus ambience.

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AudioLines,
  Bot,
  ChevronLeft,
  ChevronRight,
  Info,
  Leaf,
  Minus,
  PictureInPicture2,
  Plus,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  STATUSES,
  fmtClock,
  fmtHM,
  statusOf,
  useAmbience,
  type NoiseKind,
  type Running,
  type StatusId,
} from "./proLib";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

const eyebrowCls = "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const roundBtnCls =
  "flex shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground";

type LiveRoom = {
  id: string;
  title: string;
  source_type: string;
  thumbnail_url: string | null;
  watching: number;
};

type Props = {
  current: Running;
  elapsed: number;
  onSwitch: (id: StatusId) => void;
};

export function FocusPanel({ current, elapsed, onSwitch }: Props) {
  const status = statusOf(current.id);
  const [showMore, setShowMore] = useState(false);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [idx, setIdx] = useState(0);
  const [pip, setPip] = useState<Window | null>(null);
  const ambience = useAmbience();

  // live watch parties
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await db.rpc("get_watch_party_lobby");
      if (alive && Array.isArray(data)) setRooms((data as LiveRoom[]).slice(0, 8));
    };
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const room = rooms.length ? rooms[idx % rooms.length] : null;

  const popOut = useCallback(async () => {
    const dpip = (window as any).documentPictureInPicture;
    if (!dpip) {
      toast("Pop out needs desktop Chrome or Edge. This browser doesn't support it.");
      return;
    }
    try {
      const w: Window = await dpip.requestWindow({ width: 280, height: 170 });
      w.document.body.style.cssText =
        "margin:0;background:#0b0b0d;color:#fff;font-family:system-ui,sans-serif";
      w.addEventListener("pagehide", () => setPip(null));
      setPip(w);
    } catch {
      toast.error("Couldn't open the pop-out window.");
    }
  }, []);

  const visibleStatuses = STATUSES.filter((s) => showMore || !s.more);

  const noises: { id: NoiseKind; label: string; hint: string; Icon: typeof Waves }[] = [
    { id: "brown", label: "BROWN", hint: "Deep & warm", Icon: AudioLines },
    { id: "pink", label: "PINK", hint: "Steady rain", Icon: Waves },
    { id: "forest", label: "FOREST", hint: "Canopy wind", Icon: Leaf },
  ];

  return (
    <section className="relative min-w-0 overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-soft sm:p-6">
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        {/* ---------- Left: status + timer ---------- */}
        <div className="min-w-0">
          <p className={`flex items-center gap-2 ${eyebrowCls}`}>
            <span className="text-primary">✦</span> Currently focused
            <span title="Pick what you're doing. Study statuses (Deep Work, Lecture, Practice, Revision) are saved to your study time.">
              <Info className="h-4 w-4 opacity-60" />
            </span>
          </p>

          <div className="mt-2 flex min-w-0 items-center gap-2.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: status.color }} />
            <h2 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{status.label}</h2>
          </div>

          <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 font-mono text-3xl font-bold leading-none tracking-tight tabular-nums text-primary sm:text-4xl lg:text-5xl">
              {fmtClock(elapsed)}
            </p>
            <Link
              to="/ai-chat"
              aria-label="Ask AI"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Bot className="h-6 w-6" />
            </Link>
          </div>

          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Started at {fmtHM(current.startedAt)}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleStatuses.map((s) => {
              const active = s.id === current.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSwitch(s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                    active
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground sm:text-sm"
            >
              {showMore ? "Less" : "+ More"}
            </button>
          </div>

          {/* Live right now */}
          <p className={`mb-2 mt-5 flex items-center gap-2 ${eyebrowCls}`}>
            Live right now
            <Info className="h-4 w-4 opacity-60" />
          </p>
          {room ? (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40">
              <Link to="/watch/$roomId" params={{ roomId: room.id }} className="flex items-center gap-3 p-0">
                <div className="h-[84px] w-[132px] shrink-0 bg-black">
                  {room.thumbnail_url ? (
                    <img
                      src={room.thumbnail_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">📺</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 py-2 pr-12">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-rose-500">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    LIVE · {room.source_type.toUpperCase()}
                  </p>
                  <p className="mt-1 truncate text-base font-bold">{room.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{room.watching} watching · Tap to join the room</p>
                </div>
              </Link>
              {rooms.length > 1 && (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1">
                  <button type="button" aria-label="Previous" onClick={() => setIdx((i) => (i - 1 + rooms.length) % rooms.length)} className="rounded-full bg-foreground/75 p-1 text-background">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Next" onClick={() => setIdx((i) => (i + 1) % rooms.length)} className="rounded-full bg-foreground/75 p-1 text-background">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/watch"
              className="block rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/50"
            >
              No watch parties are live. <span className="font-semibold text-foreground">Start one →</span>
            </Link>
          )}
        </div>

        {/* ---------- Right: focus ambience (flat tinted panel, no nested card) ---------- */}
        <div className="min-w-0 rounded-2xl bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <p className={`flex items-center gap-2 ${eyebrowCls}`}>
              <AudioLines className="h-4 w-4 text-primary" /> Focus ambience
            </p>
            <span className={`h-9 w-9 ${roundBtnCls}`}>
              <SlidersHorizontal className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex overflow-hidden rounded-xl border border-primary/30 bg-primary/10">
            <button
              type="button"
              onClick={() => void popOut()}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
            >
              <PictureInPicture2 className="h-5 w-5" /> Pop out
            </button>
            <button
              type="button"
              onClick={() => toast("Opens a floating, always-on-top timer so your focus session stays visible over notes, videos or any full-screen app. Desktop Chrome/Edge only.")}
              aria-label="About pop out"
              className="flex w-14 items-center justify-center border-l border-primary/30 text-primary transition hover:bg-primary/10"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Opens a floating, always-on-top timer so your focus session stays visible over notes, videos, or any
            full-screen app.
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {noises.map(({ id, label, hint, Icon }) => {
              const active = ambience.kind === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => ambience.toggle(id)}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center transition ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-bold tracking-wide">{label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => (ambience.volume > 0 ? ambience.setVolume(0) : ambience.setVolume(0.5))}
              aria-label="Mute"
              className={`h-9 w-9 ${roundBtnCls}`}
            >
              {ambience.volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" aria-label="Quieter" onClick={() => ambience.setVolume(ambience.volume - 0.1)} className={`h-8 w-8 ${roundBtnCls}`}>
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(ambience.volume * 100)}
              onChange={(e) => ambience.setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
              className="h-1.5 min-w-0 flex-1 accent-primary"
            />
            <button type="button" aria-label="Louder" onClick={() => ambience.setVolume(ambience.volume + 0.1)} className={`h-8 w-8 ${roundBtnCls}`}>
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={ambience.off}
            disabled={!ambience.kind}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold tracking-widest text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            <Wind className="h-4 w-4" /> TURN SOUND OFF
          </button>
        </div>
      </div>

      {/* floating pop-out timer (separate dark window, intentionally hard-coded colors) */}
      {pip &&
        createPortal(
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, opacity: 0.7, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: status.color, display: "inline-block" }} />
              {status.label}
            </div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 44, fontWeight: 700, color: "#f5c542", marginTop: 10 }}>
              {fmtClock(elapsed)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>Started at {fmtHM(current.startedAt)}</div>
          </div>,
          pip.document.body,
        )}
    </section>
  );
}
