import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/**
 * Deletes a friendship row. The same RLS-backed delete covers three distinct
 * UI actions -- removing an accepted friend, cancelling an outgoing pending
 * request, and declining an incoming one -- since all three are just
 * "delete the row" as far as the schema is concerned (declining leaves no
 * trace, per the current friending rules -- there's no persisted "declined"
 * status to update to).
 */
export function useRemoveFriendship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.from("friendships").delete().eq("id", friendshipId).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (friendship) => {
      const { requester_id, addressee_id } = friendship;
      for (const profileId of [requester_id, addressee_id]) {
        queryClient.invalidateQueries({ queryKey: ["friends", profileId] });
        queryClient.invalidateQueries({ queryKey: ["friendRequests", profileId] });
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests", profileId] });
      }
    },
  });
}
