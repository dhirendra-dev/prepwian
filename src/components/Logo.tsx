import { cn } from "@/lib/utils";

/** Original PREPWIAN brand mark; independent of the legacy JEE Prep Hub artwork. */
export function Logo({ className, containerClassName }: { className?: string; containerClassName?: string }) {
  return (
    <div className={cn("shrink-0 overflow-hidden", containerClassName)}>
      <svg
        viewBox="0 0 128 128"
        role="img"
        aria-label="PREPWIAN"
        className={cn("h-full w-full", className)}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="prepwian-mark-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#56d6ff" />
            <stop offset="1" stopColor="#7867ff" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="30" fill="#0b1020" />
        <path d="M26 91V37h31c18 0 29 9 29 25S75 87 57 87H45v4z" fill="none" stroke="url(#prepwian-mark-gradient)" strokeWidth="9" strokeLinejoin="round" />
        <path d="M66 91l15-20 19 20" fill="none" stroke="#f8c66a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="95" cy="34" r="7" fill="#f8c66a" />
      </svg>
    </div>
  );
}
