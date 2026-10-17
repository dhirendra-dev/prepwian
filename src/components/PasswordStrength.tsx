import { useMemo } from "react";

export function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tips: string[] } {
  const tips: string[] = [];
  if (!pw) return { score: 0, label: "Empty", tips: ["Enter a password"] };

  let score = 0;
  if (pw.length >= 8) score++; else tips.push("Use at least 8 characters");
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++; else tips.push("Mix upper and lower case");
  if (/\d/.test(pw)) score++; else tips.push("Add a number");
  if (/[^A-Za-z0-9]/.test(pw)) score++; else tips.push("Add a symbol (! @ # …)");
  if (pw.length >= 12) score = Math.min(4, score + 1);

  const s = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][s];
  return { score: s, label, tips: tips.slice(0, 2) };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, tips } = useMemo(() => scorePassword(password), [password]);
  const colors = ["bg-muted", "bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const textColor = score <= 1 ? "text-destructive" : score === 2 ? "text-orange-600 dark:text-orange-400" : score === 3 ? "text-yellow-700 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : "bg-muted"}`} />
        ))}
      </div>
      <div className="flex items-start justify-between gap-2 text-[11px]">
        <p className={`font-medium ${textColor}`}>{label}</p>
        {tips.length > 0 && score < 4 && (
          <p className="text-right text-muted-foreground">{tips.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
