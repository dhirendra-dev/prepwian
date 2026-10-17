import { Check, Clock, Undo2, X } from "lucide-react";
import { Badge } from "@/components/jee360/badge";
import { Button } from "@/components/ui/button";
import { SUBJECT_SHORT } from "@/lib/jee360/planner";
import type { Lecture, LectureStatus } from "@/lib/jee360/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<Lecture["type"], string> = {
  lecture: "Lecture",
  revision: "Revision",
  doubt: "Doubt",
  dpp: "DPP",
  lab: "Lab",
};

function statusVariant(status: LectureStatus) {
  if (status === "attended") return "success" as const;
  if (status === "missed") return "danger" as const;
  return "outline" as const;
}

export function LectureRow({
  lecture,
  onStatus,
}: {
  lecture: Lecture;
  onStatus?: (status: LectureStatus) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-[background-color,border-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] sm:flex-row">
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="flex w-14 shrink-0 flex-col items-start pt-0.5">
          <span className="text-sm font-medium tabular-nums">{lecture.startTime}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{lecture.endTime}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{SUBJECT_SHORT[lecture.subject]}</Badge>
            <Badge variant="outline">{TYPE_LABEL[lecture.type]}</Badge>
            <Badge variant={statusVariant(lecture.status)}>{lecture.status}</Badge>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">{lecture.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lecture.chapter}
            {lecture.faculty ? ` · ${lecture.faculty}` : ""}
          </p>
        </div>
      </div>
      {onStatus ? (
        <div className="flex shrink-0 gap-1 sm:flex-col">
          <Button
            size="icon"
            variant={lecture.status === "attended" ? "secondary" : "ghost"}
            className="size-11 sm:size-9"
            aria-label="Mark attended"
            onClick={() => onStatus("attended")}
          >
            <Check className="size-4" />
          </Button>
          <Button
            size="icon"
            variant={lecture.status === "missed" ? "secondary" : "ghost"}
            className={cn("size-11 sm:size-9", lecture.status === "missed" && "text-destructive")}
            aria-label="Mark missed"
            onClick={() => onStatus("missed")}
          >
            <X className="size-4" />
          </Button>
          {lecture.status !== "upcoming" ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-11 sm:size-9"
              aria-label="Reset status"
              onClick={() => onStatus("upcoming")}
            >
              <Undo2 className="size-4" />
            </Button>
          ) : (
            <span className="hidden size-9 items-center justify-center text-muted-foreground sm:flex">
              <Clock className="size-4" />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
