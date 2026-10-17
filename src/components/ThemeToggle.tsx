import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { isDark, ready, toggle } = useTheme();

  if (!ready) {
    return <span className="inline-flex h-9 w-9" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      data-theme-toggle
      className="nav-glass-btn inline-flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex">
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </span>
    </button>
  );
}
