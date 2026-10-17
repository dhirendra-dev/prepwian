import { createFileRoute } from "@tanstack/react-router";
import LectureCommandCenter from "@/components/lecture/LectureCommandCenter";

export const Route = createFileRoute("/_authenticated/lecture-tracker")({
  head: () => ({ meta: [
      { property: "og:title", content: "Lecture Tracker — JEE Prep Hub" },
      { property: "og:description", content: "Organize lectures, update watched minutes and track daily study targets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Lecture Tracker — JEE Prep Hub" },
      { name: "twitter:description", content: "Organize lectures, update watched minutes and track daily study targets." },
{ title: "Lecture Tracker — JEE Prep Hub" }, { name: "description", content: "Organize lectures, update watched minutes and track daily study targets." }] }),

  component: LectureTrackerPage,
});

function LectureTrackerPage() {
  return <LectureCommandCenter />;
}
