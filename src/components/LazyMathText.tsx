import { lazy, Suspense } from "react";

const MathText = lazy(() =>
  import("@/components/MathText").then((module) => ({ default: module.MathText })),
);

type Props = { text: string; className?: string };

export function LazyMathText({ text, className }: Props) {
  return (
    <Suspense
      fallback={<div className={`whitespace-pre-wrap break-words ${className ?? ""}`}>{text}</div>}
    >
      <MathText text={text} className={className} />
    </Suspense>
  );
}
