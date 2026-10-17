import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStreakPopup(userId: string | undefined) {
  const [streak, setStreak] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!userId) return;

    abortControllerRef.current = new AbortController();
    let retryCount = 0;
    const MAX_RETRIES = 2;

    const fetchStreak = async () => {
      try {
        const { data, error } = await supabase.rpc("get_streak_popup_data");

        if (abortControllerRef.current?.signal.aborted) return;

        if (error) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(fetchStreak, 1000 * retryCount); // Exponential backoff
          }
          return;
        }

        if (data?.[0]) {
          const { streak: s, should_show } = data[0];
          if (should_show) {
            setStreak(s);
          }
        }
      } catch (err) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error("Error fetching streak popup data:", err);
        }
      }
    };

    fetchStreak();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId]);

  return { streak, clear: () => setStreak(null) };
}
