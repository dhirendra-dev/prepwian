/**
 * Liquid Glass is now the permanent, always-on skin.
 *
 * The class is applied on <html> by the root document, so nothing here needs
 * to toggle it. These helpers remain only so existing imports keep compiling
 * and always report "on".
 */
export function isLiquidGlassOn() {
  return true;
}

export function applyLiquidGlass(_on?: boolean) {
  /* no-op: glass is permanent */
}

export function useLiquidGlass() {
  return { on: true, toggle: () => {}, set: applyLiquidGlass };
}
