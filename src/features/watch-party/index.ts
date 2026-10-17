// ================================================
// JEE PREP HUB — WATCH PARTY
// Feature barrel exports
// File: src/features/watch-party/index.ts
// ================================================

// Types
export * from "./types";

// Constants
export * from "./constants";

// API
export * from "./api";

// Hooks
export * from "./hooks/useYoutubeIframe";
export * from "./hooks/useWatchPartySync";
export * from "./hooks/useRoomPresence";

// Page
export { WatchPartyPage } from "./components/WatchPartyPage";

// Components
export { PartyHeader } from "./components/PartyHeader";
export { PartySidebar } from "./components/PartySidebar";
export { WatchPartyPlayer } from "./components/WatchPartyPlayer";
export { PlayerOverlay } from "./components/PlayerOverlay";
export { MobilePartyTabs } from "./components/MobilePartyTabs";
export { SyncStatusPill } from "./components/SyncStatusPill";
export { ParticipantList } from "./components/ParticipantList";
export { ChatPanel } from "./components/ChatPanel";
export { QueuePanel } from "./components/QueuePanel";
export { RoomDetailsPanel } from "./components/RoomDetailsPanel";

// Utilities
export * from "./utils";