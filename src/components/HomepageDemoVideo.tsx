import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import videoAsset from "@/assets/jeeprephub-v3.mp4.asset.json";

export function HomepageDemoVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-5 pb-16">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> How it works
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">See JEE Prep Hub in action</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A 30-second tour of the timer, materials, community and everything in between.
        </p>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-border bg-black shadow-glow">
        <video
          ref={videoRef}
          src={shouldLoad ? videoAsset.url : undefined}
          className="mx-auto block max-h-[70vh] w-full object-contain"
          autoPlay={shouldLoad}
          muted
          loop
          playsInline
          preload={shouldLoad ? "metadata" : "none"}
          onClick={togglePlay}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause video" : "Play video"}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition hover:scale-105 active:scale-95"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-black shadow-lg transition hover:scale-105 active:scale-95"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>
    </section>
  );
}
