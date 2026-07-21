import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { GameStats } from "../../types";

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

      // The function returns zero rows when the caller isn't the owner, an
      // accepted friend, or the profile isn't public (see stats_visibility).
      const row = data[0];
      if (!row) return null;

      const stats: GameStats = {
        average: row.average,
        highGame: row.high_game,
        highSeries: row.high_series,
        strikePercentage: row.strike_percentage,
        sparePercentage: row.spare_percentage,
        openFramePercentage: row.open_frame_percentage,
      };
      return stats;
    },
    enabled: Boolean(friendProfileId),
  });
}
