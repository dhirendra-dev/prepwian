import { useEffect, useState } from "react";

export type MenuStyle = "drawer" | "sheet";

const KEY = "jph-menu-style";
const EVT = "jph-menu-style-change";

export function readMenuStyle(): MenuStyle {
  if (typeof window === "undefined") return "drawer";
  try {
    return localStorage.getItem(KEY) === "sheet" ? "sheet" : "drawer";
  } catch {
    return "drawer";
  }
}

export function setMenuStyle(style: MenuStyle) {
  try {
    localStorage.setItem(KEY, style);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: style }));
}

/** Reads the stored menu style after hydration and keeps components in sync. */
export function useMenuStyle() {
  const [style, setStyle] = useState<MenuStyle>("drawer");

  useEffect(() => {
    setStyle(readMenuStyle());
    const onEvt = (e: Event) => setStyle(((e as CustomEvent).detail as MenuStyle) ?? "drawer");
    window.addEventListener(EVT, onEvt);
    return () => window.removeEventListener(EVT, onEvt);
  }, []);

  return { style, setStyle: setMenuStyle };
}
