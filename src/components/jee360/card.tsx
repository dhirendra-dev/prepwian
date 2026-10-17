import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * JEE 360 cards reuse the app-wide liquid glass surface so the ported section
 * matches the rest of the site instead of shipping its own flat card style.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-glass-surface=""
      className={cn("glass-surface rounded-2xl text-card-foreground dark:border-slate-800/80 dark:bg-slate-900/90", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-4 pb-0", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-lg font-semibold tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
