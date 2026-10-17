import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getYouTubeChecklistWithItems,
  toggleYouTubeChecklistItem,
  setCurrentYouTubeChecklistItem,
} from "../api/youtubeChecklistApi";

import type { YouTubeChecklist, YouTubeChecklistItem, YouTubeChecklistProgress } from "../types";

type UseYouTubeChecklistReturn = {
  checklist: YouTubeChecklist | null;
  items: YouTubeChecklistItem[];
  isLoading: boolean;
  error: string | null;

  selectedItemId: string | null;

  progress: YouTubeChecklistProgress;

  selectItem: (itemId: string | null) => void;

  toggleItem: (itemId: string, completed: boolean) => Promise<void>;

  setCurrentItem: (itemId: string | null) => Promise<void>;

  nextIncompleteItem: (afterItemId?: string) => YouTubeChecklistItem | null;

  reload: (checklistId?: string) => Promise<void>;
};

export function useYouTubeChecklist(initialChecklistId?: string): UseYouTubeChecklistReturn {
  const [checklist, setChecklist] = useState<YouTubeChecklist | null>(null);

  const [items, setItems] = useState<YouTubeChecklistItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(
    initialChecklistId ?? null,
  );

  const reload = useCallback(
    async (checklistId?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const requestedChecklistId = checklistId ?? activeChecklistId;

        if (checklistId) {
          setActiveChecklistId(checklistId);
        }

        if (!requestedChecklistId) {
          setChecklist(null);
          setItems([]);
          setSelectedItemId(null);
          return;
        }

        const result = await getYouTubeChecklistWithItems(requestedChecklistId);

        if (!result) {
          setChecklist(null);
          setItems([]);
          setSelectedItemId(null);
          return;
        }

        setChecklist(result);
        const resultItems = result.items ?? [];
        setItems(resultItems);

        const currentItemId = result.current_item_id;

        if (currentItemId && resultItems.some((item) => item.id === currentItemId)) {
          setSelectedItemId(currentItemId);
        } else if (resultItems.length > 0) {
          setSelectedItemId(resultItems[0].id);
        } else {
          setSelectedItemId(null);
        }
      } catch (loadError) {
        console.error("Failed to load YouTube checklist:", loadError);

        setError(
          loadError instanceof Error ? loadError.message : "Failed to load YouTube checklist.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeChecklistId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectItem = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
  }, []);

  const toggleItem = useCallback(
    async (itemId: string, completed: boolean) => {
      try {
        setError(null);

        const updatedItem = await toggleYouTubeChecklistItem(itemId, completed);

        setItems((currentItems) =>
          currentItems.map((item) => (item.id === itemId ? updatedItem : item)),
        );

        setChecklist((currentChecklist) => {
          if (!currentChecklist) {
            return currentChecklist;
          }

          const completedItems = items.reduce(
            (count, item) =>
              count + (item.id === itemId ? Number(completed) : item.is_completed ? 1 : 0),
            0,
          );

          return {
            ...currentChecklist,
            completed_items: completedItems,
            updated_at: new Date().toISOString(),
          };
        });
      } catch (toggleError) {
        console.error("Failed to toggle YouTube checklist item:", toggleError);

        setError(
          toggleError instanceof Error ? toggleError.message : "Failed to update checklist item.",
        );

        throw toggleError;
      }
    },
    [items],
  );

  const setCurrentItem = useCallback(
    async (itemId: string | null) => {
      if (!checklist) {
        setSelectedItemId(itemId);
        return;
      }

      try {
        setSelectedItemId(itemId);

        await setCurrentYouTubeChecklistItem(checklist.id, itemId);

        setChecklist((currentChecklist) =>
          currentChecklist
            ? {
                ...currentChecklist,
                currentItemId: itemId,
              }
            : currentChecklist,
        );
      } catch (currentItemError) {
        console.error("Failed to set current YouTube checklist item:", currentItemError);
      }
    },
    [checklist],
  );

  const nextIncompleteItem = useCallback(
    (afterItemId?: string) => {
      if (items.length === 0) {
        return null;
      }

      const startIndex = afterItemId ? items.findIndex((item) => item.id === afterItemId) + 1 : 0;

      const orderedItems = [...items.slice(startIndex), ...items.slice(0, Math.max(startIndex, 0))];

      return orderedItems.find((item) => !item.is_completed) ?? null;
    },
    [items],
  );

  const progress = useMemo<YouTubeChecklistProgress>(() => {
    const totalItems = items.length;

    const completedItems = items.filter((item) => item.is_completed).length;

    const remainingItems = totalItems - completedItems;

    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    return {
      totalItems,
      completedItems,
      remainingItems,
      percentage,
    };
  }, [items]);

  return {
    checklist,
    items,
    isLoading,
    error,
    selectedItemId,
    progress,
    selectItem,
    toggleItem,
    setCurrentItem,
    nextIncompleteItem,
    reload,
  };
}
