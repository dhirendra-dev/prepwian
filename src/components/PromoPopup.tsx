
import { useState, useEffect } from "react";

const WHATSAPP_LINK = "https://chat.whatsapp.com/DXInW9jKD90Cq3x58XfEQl";

const KEY_LAST = "jph_promo_last_shown";
const KEY_BLOCK = "jph_promo_blocked";
const GAP_MS = 3 * 24 * 60 * 60 * 1000; // show again after 3 days

function readNum(key: string): number {
  try {
    return Number(localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
}
function write(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readNum(KEY_BLOCK) === 1) return;
    if (Date.now() - readNum(KEY_LAST) < GAP_MS) return;
    const t = setTimeout(() => {
      setOpen(true);
      write(KEY_LAST, String(Date.now()));
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const close = () => setOpen(false);
  const block = () => {
    write(KEY_BLOCK, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-40 flex justify-center p-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-full sm:max-w-sm"
    >
      <div
        role="dialog"
        aria-label="PREPWIAN Official Community"
        className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/10 text-slate-600 flex items-center justify-center"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          PREPWIAN Official Community
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Only important announcements and updates. No groups or unnecessary chats.
          Your privacy and phone number stay protected.
        </p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={block}
          className="inline-block w-full bg-green-600 text-white font-semibold py-3 rounded-xl"
        >
          Join Now
        </a>
        <button
          onClick={block}
          className="mt-3 text-xs text-slate-500 underline"
        >
          Don't show again
        </button>
      </div>
    </div>
  );
}
