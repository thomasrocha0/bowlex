import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface CreateSeriesWithGamesInput {
  /** Only used for cache invalidation -- the server derives ownership from auth.uid(). */
  profileId: string;
  /** ISO timestamp. */
  bowledAt: string;
  /** One entry per game, each exactly 10 frames of numeric rolls. */
  games: number[][][];
}

/**
 * Calls the `create_series_with_games` Postgres function, which inserts the
 * series, every game, and every frame in a single transaction. The UI
 * validates frames before submit (see "Core Logic Notes" in CLAUDE.md), and
 * the server independently re-validates every roll against the same bowling
 * rules (see 20260718090000_add_frame_roll_validation.sql) -- both layers
 * matter, since this call is reachable directly, not just through the UI.
 */
export function useCreateSeriesWithGames() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bowledAt, games }: CreateSeriesWithGamesInput) => {
      const { data, error } = await supabase.rpc("create_series_with_games", {
        p_bowled_at: bowledAt,
        p_games: games,
        p_league_id: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games", variables.profileId] });
    },
  });
}
