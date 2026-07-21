import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/**
 * Blocks a user via the block_user RPC, which also deletes any existing
 * friendship/pending-request row between the two (in either direction) so
 * "blocked" is a clean, exclusive state. See
 * 20260715090500_create_friendships.sql.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockerId, blockedId }: { blockerId: string; blockedId: string }) => {
      const { data, error } = await supabase.rpc("block_user", { p_blocked_id: blockedId });

      if (error) throw error;
      return { ...data, blockerId };
    },
    onSuccess: ({ blockerId, blocked_id }) => {
      for (const profileId of [blockerId, blocked_id]) {
        queryClient.invalidateQueries({ queryKey: ["friends", profileId] });
        queryClient.invalidateQueries({ queryKey: ["friendRequests", profileId] });
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests", profileId] });
      }
      queryClient.invalidateQueries({ queryKey: ["blockedUsers", blockerId] });
    },
  });
}
