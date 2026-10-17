import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Sparkles } from "lucide-react";
import type { PulseSuggestion } from "@/lib/pulse.functions";

/**
 * AI study suggestion: picks the weakest chapter from the learner's last CBT
 * attempts and recommends a matching lecture. Renders nothing until it has data.
*/
export function PulseAiCard({
  fetchSuggestion,
  onOpen,
}: {
  fetchSuggestion: () =>
Promise<PulseSuggestion | null>;
  onOpen: (video: PulseSuggestion["video"], el: HTMLElement | null) => void;
}) {
  const btn = useRef<HTMLButtonElement | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["pulse-suggestion"],
    queryFn: fetchSuggestion,
    staleTime: 300_000,
    retry: false,
  });

  if (isLoading || !data) return null;

  return (
    <section
      className="pl-card pl-enter mb-3 p-4"
      style={{ borderLeft: "3px solid #A78BFA" }}
      aria-label="AI study suggestion"
    ><div className="pl-mono flex items-center gap-1.5" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <Sparkles className="h-3.5w-3.5" />
        Suggested for you
      </div>
      <p className="pl-head mt-2" style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.35 }}>
        You scored {data.scorePercent}% in {data.chapter} — revise it with this {data.subject} lecture.
      </p>
      <button
        ref={btn}
        type="button"
        onClick={() => onOpen(data.video, btn.current)}
        className="pl-mono mt-3 rounded-full px-3.5 py-1.5"
        style={{ background: "#A78BFA", color: "#10131C", fontSize: 11.5, fontWeight: 600 }}
      >
        Watch {data.video.title.length > 34 ? `${data.video.title.slice(0, 34)}…` : data.video.title}
      </button>
    </section>
  );
}