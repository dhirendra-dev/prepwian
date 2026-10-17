import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  }
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const matches =
        event.key.toLowerCase() === key.toLowerCase() &&
        !!options?.ctrl === event.ctrlKey &&
        !!options?.shift === event.shiftKey &&
        !!options?.alt === event.altKey;

      if (!matches) return;

      event.preventDefault();
      callback();
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [key, callback, options]);
}