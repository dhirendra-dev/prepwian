// ============================================================
// PREPWIAN
// YouTube Checklist Types
// ============================================================

export type YouTubeChecklistSourceType = "video" | "playlist";

export type YouTubeChecklistItem = {
  id: string;
  checklist_id: string;

  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;

  position: number;

  is_completed: boolean;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
};

export type YouTubeChecklist = {
  id: string;
  user_id: string;

  title: string;
  description: string | null;

  source_type: YouTubeChecklistSourceType;
  source_url: string;

  youtube_playlist_id: string | null;
  current_item_id: string | null;

  total_items: number;
  completed_items: number;

  is_archived: boolean;

  created_at: string;
  updated_at: string;

  items?: YouTubeChecklistItem[];
};

export type CreateYouTubeChecklistInput = {
  title: string;
  description?: string | null;

  sourceType: YouTubeChecklistSourceType;
  sourceUrl: string;

  youtubePlaylistId?: string | null;
};

export type UpdateYouTubeChecklistInput = {
  checklistId: string;

  title?: string;
  description?: string | null;

  currentItemId?: string | null;
  isArchived?: boolean;
};

export type CreateYouTubeChecklistItemInput = {
  checklistId: string;

  youtubeVideoId: string;
  title: string;

  thumbnailUrl?: string | null;
  durationSeconds?: number | null;

  position?: number;
};

export type UpdateYouTubeChecklistItemInput = {
  itemId: string;

  title?: string;
  position?: number;

  isCompleted?: boolean;
};

export type YouTubeChecklistProgress = {
  totalItems: number;
  completedItems: number;
  remainingItems: number;
  percentage: number;
};

export type YouTubePlayerPosition = {
  videoId: string;
  currentTime: number;
  duration: number;
};

export type FloatingPlayerPosition = {
  x: number;
  y: number;
};

export type FloatingPlayerSize = {
  width: number;
  height: number;
};

export type YouTubeChecklistPlayerState =
  "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued" | "unknown";

export type YouTubeChecklistPlayer = {
  videoId: string | null;
  title: string | null;

  currentTime: number;
  duration: number;

  isPlaying: boolean;
  isReady: boolean;

  playbackRate: number;
};

export type YouTubeVideoInput = {
  youtubeVideoId: string;
  title: string;

  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
};

export type YouTubePlaylistInput = {
  playlistId: string;
  title?: string | null;

  videos: YouTubeVideoInput[];
};

export type YouTubeChecklistState = {
  checklist: YouTubeChecklist | null;
  items: YouTubeChecklistItem[];

  selectedItemId: string | null;

  isLoading: boolean;
  isSaving: boolean;

  error: string | null;
};

export type YouTubeChecklistActions = {
  selectItem: (itemId: string) => void;
  toggleItem: (itemId: string, completed: boolean) => Promise<void>;
  setCurrentItem: (itemId: string | null) => Promise<void>;
};

export type YouTubeChecklistPageProps = {
  checklistId?: string;
};

export type YouTubeChecklistCardProps = {
  checklist: YouTubeChecklist;
  onOpen?: (checklist: YouTubeChecklist) => void;
  onDelete?: (checklist: YouTubeChecklist) => void;
};

export type YouTubeChecklistItemProps = {
  item: YouTubeChecklistItem;
  isActive?: boolean;

  onSelect: (item: YouTubeChecklistItem) => void;
  onToggleComplete: (item: YouTubeChecklistItem, completed: boolean) => Promise<void>;
};

export type FloatingYouTubePlayerProps = {
  videoId: string | null;
  title?: string;

  position: FloatingPlayerPosition;
  size?: FloatingPlayerSize;

  onPositionChange: (position: FloatingPlayerPosition) => void;
  onClose?: () => void;

  onVideoEnded?: () => void;
  onReady?: () => void;
};

export type YouTubeChecklistImportResult = {
  sourceType: YouTubeChecklistSourceType;

  sourceUrl: string;

  playlistId: string | null;

  videos: YouTubeVideoInput[];
};

export type YouTubeChecklistFilter = "all" | "completed" | "remaining";

export type YouTubeChecklistSort = "playlist-order" | "title" | "duration";

export type YouTubeChecklistViewState = {
  filter: YouTubeChecklistFilter;
  sort: YouTubeChecklistSort;

  searchQuery: string;

  showCompleted: boolean;
};

export type YouTubeChecklistSummary = {
  id: string;
  title: string;

  totalItems: number;
  completedItems: number;

  progressPercentage: number;

  currentItemId: string | null;
};
