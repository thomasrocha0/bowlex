import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { GameStats } from "../types";

/**
 * Calls the `get_friend_stats` Postgres function (security-definer), which
 * enforces the friendship + stats_visibility check server-side. See the
 * "Social data access" section of CLAUDE.md.
 */
export function useFriendStats(friendProfileId: string) {
  return useQuery({
    queryKey: ["friendStats", friendProfileId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_friend_stats", {
        target_profile_id: friendProfileId,
      });

      if (error) throw error;

      const stats: GameStats = {
        average: data.average,
        highGame: data.high_game,
        highSeries: data.high_series,
        strikePercentage: data.strike_percentage,
        sparePercentage: data.spare_percentage,
        openFramePercentage: data.open_frame_percentage,
      };
      return stats;
    },
    enabled: Boolean(friendProfileId),
  });
}
