import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Sound = "none" | "brown" | "white" | "rain";

// Procedural ambient noise via Web Audio API — no external audio files needed.
function createBrownNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function createWhiteNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function createRain(ctx: AudioContext) {
  // Filtered pink noise approximates rainfall.
  const src = createWhiteNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2000;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 200;
  src.connect(hp).connect(filter);
  return { src, out: filter as AudioNode };
}

export function AmbientSounds() {
  const [sound, setSound] = useState<Sound>("none");
  const [volume, setVolume] = useState(0.4);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src: AudioBufferSourceNode; gain: GainNode } | null>(null);

  useEffect(() => {
    return () => {
      nodesRef.current?.src.stop();
      nodesRef.current = null;
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!nodesRef.current) return;
    nodesRef.current.gain.gain.value = volume;
  }, [volume]);

  async function activate(next: Sound) {
    if (sound === next) return;
    // Tear down previous
    if (nodesRef.current) {
      try { nodesRef.current.src.stop(); } catch { /* ignore */ }
      nodesRef.current = null;
    }
    if (next === "none") {
      setSound("none");
      return;
    }
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      ctxRef.current = ctx;
    }
    if (ctx.state === "suspended") await ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    let src: AudioBufferSourceNode;
    if (next === "brown") {
      src = createBrownNoise(ctx);
      src.connect(gain);
    } else if (next === "white") {
      src = createWhiteNoise(ctx);
      src.connect(gain);
    } else {
      const rain = createRain(ctx);
      src = rain.src;
      rain.out.connect(gain);
    }
    src.start();
    nodesRef.current = { src, gain };
    setSound(next);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Ambient sounds</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => activate("none")}
          className="h-7 px-2 text-xs"
          disabled={sound === "none"}
        >
          <VolumeX className="mr-1 h-3 w-3" /> Off
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["brown", "white", "rain"] as const).map((s) => (
          <Button
            key={s}
            variant={sound === s ? "default" : "outline"}
            size="sm"
            onClick={() => activate(s)}
            className="capitalize"
          >
            {s === "brown" ? "Brown noise" : s === "white" ? "White noise" : "Rain"}
          </Button>
        ))}
      </div>
      {sound !== "none" && (
        <div className="mt-3 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={(v) => setVolume((v[0] ?? 40) / 100)}
            max={100}
            step={1}
          />
        </div>
      )}
    </div>
  );
}
