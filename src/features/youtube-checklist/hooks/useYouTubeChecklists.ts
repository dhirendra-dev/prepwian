import { useCallback, useEffect, useState } from "react";

import { getYouTubeChecklists } from "../api/youtubeChecklistApi";

import type { YouTubeChecklist } from "../types";

type UseYouTubeChecklistsReturn = {
  checklists: YouTubeChecklist[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useYouTubeChecklists(): UseYouTubeChecklistsReturn {
  const [checklists, setChecklists] = useState<YouTubeChecklist[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getYouTubeChecklists();

      setChecklists(result);
    } catch (loadError) {
      console.error("Failed to load YouTube checklists:", loadError);

      setError(
        loadError instanceof Error ? loadError.message : "Failed to load YouTube checklists.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    checklists,
    isLoading,
    error,
    reload,
  };
}
