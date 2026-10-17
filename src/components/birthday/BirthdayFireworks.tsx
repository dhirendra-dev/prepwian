import type { CSSProperties } from "react";

const BURSTS = [
  { left: "18%", top: "33%", color: "#fb7185", delay: "0ms" },
  { left: "53%", top: "23%", color: "#fbbf24", delay: "420ms" },
  { left: "82%", top: "39%", color: "#60a5fa", delay: "820ms" },
];
const PARTICLES = Array.from({ length: 16 }, (_, index) => index);

export function BirthdayFireworks({
  active,
  cycle,
  fullScreen = false,
}: {
  active: boolean;
  cycle: number;
  fullScreen?: boolean;
}) {
  if (!active) return null;

  return (
    <div
      key={cycle}
      aria-hidden="true"
      className={`pointer-events-none ${fullScreen ? "fixed" : "absolute"} inset-0 z-[4] overflow-hidden`}
    >
      <style>{`
        @keyframes jph-firework-trail {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.12); }
          14% { opacity: .98; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--firework-x)),calc(-50% + var(--firework-y))) scale(.72); }
        }
        @keyframes jph-firework-core {
          0%,100% { opacity: 0; transform: scale(.25); }
          18% { opacity: .9; transform: scale(1); }
          72% { opacity: .55; transform: scale(.65); }
        }
        .birthday-firework-particle { position:absolute; left:50%; top:50%; width:3px; height:14px; border-radius:99px; background:linear-gradient(to bottom,white,var(--firework-color)); box-shadow:0 0 9px var(--firework-color),0 0 18px color-mix(in srgb,var(--firework-color) 75%,transparent); animation:jph-firework-trail 1.05s cubic-bezier(.12,.72,.28,1) var(--firework-delay) both; }
        .birthday-firework-core { position:absolute; left:50%; top:50%; width:18px; height:18px; border-radius:50%; background:var(--firework-color); filter:blur(5px); box-shadow:0 0 24px 8px var(--firework-color); animation:jph-firework-core 1.05s ease-out var(--firework-delay) both; }
        @media (prefers-reduced-motion: reduce) { .birthday-firework-particle,.birthday-firework-core { animation:none!important; opacity:.28!important; } }
      `}</style>
      {BURSTS.map((burst, burstIndex) => (
        <span
          key={`${cycle}-burst-${burstIndex}`}
          className="absolute h-px w-px"
          style={{ left: burst.left, top: burst.top, color: burst.color } as CSSProperties}
        >
          <i
            className="birthday-firework-core"
            style={
              { "--firework-color": burst.color, "--firework-delay": burst.delay } as CSSProperties
            }
          />
          {PARTICLES.map((index) => {
            const angle = (index / PARTICLES.length) * Math.PI * 2;
            const distance = 42 + ((index * 13 + burstIndex * 17) % 42);
            return (
              <i
                key={`${cycle}-${burstIndex}-${index}`}
                className="birthday-firework-particle"
                style={
                  {
                    "--firework-x": `${Math.cos(angle) * distance}px`,
                    "--firework-y": `${Math.sin(angle) * distance}px`,
                    "--firework-color": burst.color,
                    "--firework-delay": `${Number.parseInt(burst.delay, 10) + (index % 4) * 18}ms`,
                    transform: `translate(-50%,-50%) rotate(${index * 22.5}deg)`,
                  } as CSSProperties
                }
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}
