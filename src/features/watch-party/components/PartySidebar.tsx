  import {
  Info,
  ListVideo,
  MessageCircle,
  Users,
} from "lucide-react";

import type {
  WatchChatMessage,
  WatchParticipant,
  WatchRoom,
  WatchRoomQueueItem,
} from "../types";

import { ChatPanel } from "./ChatPanel";
import { ParticipantList } from "./ParticipantList";
import { QueuePanel } from "./QueuePanel";
import { RoomDetailsPanel } from "./RoomDetailsPanel";

export type PartySidebarTab =
  | "chat"
  | "participants"
  | "queue"
  | "details";

type PartySidebarProps = {
  room: WatchRoom;

  activeTab: PartySidebarTab;

  messages: WatchChatMessage[];
  participants: WatchParticipant[];
  queue: WatchRoomQueueItem[];
  currentUserId: string;
  isHost: boolean;

  onTabChange: (
    tab: PartySidebarTab,
  ) => void;

  onSendMessage: (
    body: string,
    timestampSeconds?: number,
  ) => Promise<void>;

  onSelectQueueItem: (
    item: WatchRoomQueueItem,
  ) => Promise<void>;
};

const tabs: Array<{
  id: PartySidebarTab;
  label: string;
  icon: typeof MessageCircle;
}> = [
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    id: "participants",
    label: "People",
    icon: Users,
  },
  {
    id: "queue",
    label: "Queue",
    icon: ListVideo,
  },
  {
    id: "details",
    label: "Details",
    icon: Info,
  },
];

export function PartySidebar({
  room,
  activeTab,
  messages,
  participants,
  queue,
  currentUserId,
  isHost,
  onTabChange,
  onSelectQueueItem,
}: PartySidebarProps) {
  return (
    <aside className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:h-[calc(100vh-112px)] lg:max-h-[880px]">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Watch party sections"
        className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800"
      >
        {tabs.map(
          ({
            id,
            label,
            icon: Icon,
          }) => {
            const active =
              activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() =>
                  onTabChange(id)
                }
                className={[
                  "flex min-w-0 flex-col items-center gap-1 border-b-2 px-2 py-3 text-[11px] font-medium transition",
                  active
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  {label}
                </span>
              </button>
            );
          },
        )}
      </div>

      {/* Active tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <ChatPanel
            roomId={room.id}
            messages={messages}
            currentUserId={currentUserId}
          />
        )}

        {activeTab ===
          "participants" && (
          <ParticipantList
            participants={participants}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "queue" && (
          <QueuePanel
            roomId={room.id}
            queue={queue}
            currentQueueItemId={
              room.current_queue_item_id
            }
            isHost={isHost}
            onSelectQueueItem={
              onSelectQueueItem
            }
          />
        )}

        {activeTab === "details" && (
          <RoomDetailsPanel
            room={room}
          />
        )}
      </div>
    </aside>
  );
}
