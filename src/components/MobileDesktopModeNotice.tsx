import { MonitorSmartphone, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

function isPhoneDesktopMode() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const hasDesktopViewport = window.innerWidth >= 768;
  const phoneSizedScreen = Math.min(window.screen.width, window.screen.height) <= 600;

  return isTouchDevice && hasDesktopViewport && phoneSizedScreen;
}

export function MobileDesktopModeNotice() {
  const [isUnsupportedMode, setIsUnsupportedMode] = useState(false);

  useEffect(() => {
    const updateMode = () => setIsUnsupportedMode(isPhoneDesktopMode());
    updateMode();
    window.addEventListener("resize", updateMode);
    window.addEventListener("orientationchange", updateMode);

    return () => {
      window.removeEventListener("resize", updateMode);
      window.removeEventListener("orientationchange", updateMode);
    };
  }, []);

  if (!isUnsupportedMode) return null;

  return (
    <div
      className="mobile-desktop-mode-notice"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="mobile-desktop-mode-title"
      aria-describedby="mobile-desktop-mode-description"
    >
      <div className="mobile-desktop-mode-card">
        <div className="mobile-desktop-mode-icon" aria-hidden="true">
          <MonitorSmartphone className="h-8 w-8" strokeWidth={1.8} />
        </div>
        <p className="mobile-desktop-mode-eyebrow">Mobile view required</p>
        <h1 id="mobile-desktop-mode-title">Desktop site mode isn’t supported on phones</h1>
        <p id="mobile-desktop-mode-description">
          PREPWIAN is optimized for your phone’s mobile layout. Turn off “Desktop site” in your
          browser settings, then reload this page for the best experience.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reload after switching back
        </button>
      </div>
    </div>
  );
}
