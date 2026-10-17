import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PostLoginDestinationChooser } from "@/components/articles/PostLoginDestinationChooser";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { consumePostLoginChoice } from "@/lib/post-login-destination";

export const Route = createFileRoute("/start")({
  head: () => ({ meta: [
      { name: "description", content: "Choose resources, practice tests, focus tools or community spaces for your next study session." },
      { property: "og:title", content: "Choose your next step — PREPWIAN" },
      { property: "og:description", content: "Choose resources, practice tests, focus tools or community spaces for your next study session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Choose your next step — PREPWIAN" },
      { name: "twitter:description", content: "Choose resources, practice tests, focus tools or community spaces for your next study session." },
{ title: "Choose your next step — PREPWIAN" }] }),
  component: StartPage,
});

function StartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const checked = useRef(false);
  const [showChooser, setShowChooser] = useState(false);

  useEffect(() => {
    if (loading || checked.current) return;
    checked.current = true;
    const isRegularAccount = Boolean(
      user && !(user as typeof user & { is_anonymous?: boolean }).is_anonymous,
    );
    if (isRegularAccount && consumePostLoginChoice()) {
      setShowChooser(true);
      return;
    }
    void navigate({ to: user ? "/dashboard" : "/", replace: true });
  }, [loading, navigate, user]);

  if (loading || !checked.current)
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-12" aria-label="Loading your next step">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full" />
        <div className="grid gap-4 pt-5 sm:grid-cols-2">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </main>
    );
  if (!showChooser) return null;
  const metadata = user?.user_metadata ?? {};
  const userLabel = String(metadata.full_name ?? metadata.name ?? user?.email ?? "");
  return <PostLoginDestinationChooser userLabel={userLabel || undefined} />;
}
