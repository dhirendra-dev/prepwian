import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

/** Uses the app-wide theme store so JEE 360 never fights the rest of the site. */
export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
