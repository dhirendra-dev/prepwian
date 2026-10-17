import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/watch")({
  component: WatchLayout,
});

function WatchLayout() {
  return <Outlet />;
}