import { Palette, Sparkles, Waves, EyeOff, Droplets, LayoutGrid, X } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BG_PRESETS, useBgMotion, type BgPresetKey } from "@/lib/bg-motion";
import { useUiMode } from "@/lib/ui-mode";
import { useColorPalette, type ColorPalette } from "@/lib/color-palette";
import { BACKGROUND_COLORS, useBackgroundColor, type BackgroundColorPreset } from "@/lib/bg-color";
import { cn } from "@/lib/utils";
import "./BackgroundSettings.mobile.css";

const presetMeta: { key: BgPresetKey; label: string; desc: string; icon: typeof Sparkles }[] = [
  { key: "default", label: "Default", desc: "Full Gemini colour drift", icon: Sparkles },
  { key: "soft", label: "Soft & light", desc: "Barely visible, very slow", icon: Waves },
  { key: "off", label: "Off", desc: "Plain static background", icon: EyeOff },
];

export function BackgroundSettings() {
  const [open, setOpen] = useState(false);
  const { motion, update, ready, preset } = useBgMotion();
  const ui = useUiMode();
  const colours = useColorPalette();
  const pageBackground = useBackgroundColor();

  if (!ready) return <span className="inline-flex h-9 w-9" aria-hidden />;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Background colour settings"
        title="Background colours"
        className="nav-glass-btn inline-flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Palette className="h-[18px] w-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="appearance-settings-sheet max-h-[85vh] w-72 overflow-y-auto">
        <div className="appearance-settings-header">
          <span className="text-sm font-semibold">Theme &amp; appearance</span>
          <button
            type="button"
            aria-label="Close theme settings"
            onClick={() => setOpen(false)}
            className="grid h-10 w-10 shrink-0 touch-manipulation place-items-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-2 px-2 pb-2 max-sm:grid-cols-2 max-sm:gap-2.5 max-sm:px-1.5">
          {([
            { key: "ocean", label: "Ocean", swatch: "bg-palette-ocean" },
            { key: "forest", label: "Forest", swatch: "bg-palette-forest" },
            { key: "coral", label: "Coral", swatch: "bg-palette-coral" },
            { key: "violet", label: "Violet", swatch: "bg-palette-violet" },
            { key: "rose", label: "Rose", swatch: "bg-palette-rose" },
            { key: "amber", label: "Amber", swatch: "bg-palette-amber" },
          ] as { key: ColorPalette; label: string; swatch: string }[]).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => colours.set(option.key)}
              aria-pressed={colours.palette === option.key}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors max-sm:min-h-14 max-sm:rounded-xl max-sm:py-2.5 max-sm:text-sm",
                colours.palette === option.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/60",
              )}
            >
              <span className={cn("h-5 w-5 rounded-full ring-2 ring-background shadow-sm", option.swatch)} />
              {option.label}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Page background</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1.5 px-2 pb-2 max-sm:grid-cols-2 max-sm:gap-2 max-sm:px-1.5">
          {(Object.entries(BACKGROUND_COLORS) as [Exclude<BackgroundColorPreset, "custom">, { label: string; color: string }][]).map(([key, option]) => (
            <button key={key} type="button" onClick={() => pageBackground.update({ preset: key, color: option.color })} aria-pressed={pageBackground.background.preset === key} className={cn("flex min-w-0 items-center gap-2 rounded-lg border px-1.5 py-2 text-left text-[10px] font-semibold transition max-sm:min-h-12 max-sm:gap-2.5 max-sm:rounded-xl max-sm:px-2 max-sm:py-2.5 max-sm:text-xs", pageBackground.background.preset === key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/60")}>
              <span className="h-4 w-4 shrink-0 rounded-md border border-black/10 max-sm:h-5 max-sm:w-5" style={{ backgroundColor: option.color }}/><span className="min-w-0 break-words">{option.label}</span>
            </button>
          ))}
        </div>
        <label className="mx-2 mb-2 flex items-center justify-between rounded-lg border border-border px-2 py-1.5 text-xs font-medium max-sm:mx-1 max-sm:min-h-12 max-sm:rounded-xl max-sm:px-3 max-sm:text-sm">Custom page tint<input type="color" aria-label="Choose a custom page background color" value={pageBackground.background.color} onChange={(event) => pageBackground.update({ preset: "custom", color: event.target.value })} className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0 max-sm:h-9 max-sm:w-11"/></label>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Site look</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-2 px-2 pb-2 max-sm:gap-2.5 max-sm:px-1.5">
          {([
            { key: "glass", label: "Liquid Glass", icon: Droplets },
            { key: "legacy", label: "Scholar Desk", icon: LayoutGrid },
            { key: "ios27", label: "iOS 27 Beta", icon: Sparkles },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => ui.set(opt.key)}
              aria-pressed={ui.mode === opt.key}
              className={cn(
                "flex min-w-0 flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition-colors max-sm:min-h-24 max-sm:rounded-2xl max-sm:p-3",
                ui.mode === opt.key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/60",
              )}
            >
              <opt.icon className="h-4 w-4" />
              <span className="text-xs font-semibold leading-tight max-sm:text-sm">{opt.label}</span>
                <span className="text-[10px] leading-4 text-muted-foreground max-sm:text-[11px]">
                  {opt.key === "glass"
                    ? "Blurred glass panels"
                    : opt.key === "legacy"
                      ? "Paper cards, ink and editorial rails"
                      : "Spatial glass with adaptive light and depth"}
              </span>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Background colours</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-1 px-1 pb-1">
          {presetMeta.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => update(BG_PRESETS[p.key])}
              aria-pressed={preset === p.key}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
                preset === p.key ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <p.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{p.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <div className="space-y-3 px-3 pb-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customise {preset === "custom" && <span className="text-primary">• custom</span>}
            </span>
          </div>

          <label className="block space-y-1">
            <span className="flex items-center justify-between text-xs">
              <span>Visibility</span>
              <span className="text-muted-foreground">{Math.round(motion.strength * 100)}%</span>
            </span>
            <input
              type="range"
              min={20}
              max={140}
              step={5}
              value={Math.round(motion.strength * 100)}
              disabled={!motion.enabled}
              onChange={(e) => update({ strength: Number(e.target.value) / 100 })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-50"
            />
          </label>

          <label className="block space-y-1">
            <span className="flex items-center justify-between text-xs">
              <span>Speed</span>
              <span className="text-muted-foreground">{motion.speed}s cycle</span>
            </span>
            <input
              type="range"
              min={6}
              max={60}
              step={2}
              value={motion.speed}
              disabled={!motion.enabled}
              onChange={(e) => update({ speed: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-50"
            />
          </label>

          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Colour cycling (blue → pink)</span>
            <input
              type="checkbox"
              checked={motion.hue}
              disabled={!motion.enabled}
              onChange={(e) => update({ hue: e.target.checked })}
              className="h-4 w-4 accent-primary disabled:opacity-50"
            />
          </label>

          <label className="flex items-center justify-between gap-2 text-xs">
            <span>Animate background</span>
            <input
              type="checkbox"
              checked={motion.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
