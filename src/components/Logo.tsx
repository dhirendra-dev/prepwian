import logoAsset from "@/assets/logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, containerClassName }: { className?: string; containerClassName?: string }) {
  return (
    <div className={cn("shrink-0 overflow-hidden", containerClassName)}>
      <img
        src={logoAsset.url}
        alt="JEE Prep Hub"
        className={cn("h-full w-full object-contain", className)}
      />
    </div>
  );
}
