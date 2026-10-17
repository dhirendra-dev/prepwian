export const NATIVE_NAVIGATION_ITEMS = [
  { to: "/welcome", label: "Welcome", icon: "home", match: (path: string) => path === "/welcome" },
  {
    to: "/searches",
    label: "Search",
    icon: "search",
    match: (path: string) => path === "/searches",
  },
  {
    to: "/articles",
    label: "Articles",
    icon: "articles",
    match: (path: string) => path === "/articles" || path.startsWith("/articles/"),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: "settings",
    match: (path: string) => path === "/settings",
  },
] as const;

export function shouldShowNativeBottomNavigation(pathname: string) {
  return NATIVE_NAVIGATION_ITEMS.some((item) => item.match(pathname));
}
