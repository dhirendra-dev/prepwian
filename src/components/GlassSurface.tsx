import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single canonical glass surface in the app.
 *
 * Use this for every card / panel / row instead of ad-hoc
 * `bg-card/60 backdrop-blur-…` combinations. It is intentionally NOT used on
 * page-level wrappers: nesting the same blur selector inside itself makes the
 * effect stack and read as flat/opaque. Page wrappers use `data-lg-root`.
 */
export function GlassSurface({
  as: Tag = "div",
  className,
  interactive = false,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  interactive?: boolean;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Tag
      data-glass-surface=""
      className={cn(
        "glass-surface rounded-2xl",
        interactive && "glass-surface-interactive",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
