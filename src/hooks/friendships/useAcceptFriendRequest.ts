import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/**
 * Accepts a pending friend request via the accept_friend_request RPC rather
 * than a plain update -- accepting also has to delete the mirror-direction
 * pending row (if the addressee had separately invited the requester before
 * responding), and the RPC does both in one transaction. See
 * 20260715090500_create_friendships.sql.
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase.rpc("accept_friend_request", { p_friendship_id: friendshipId });

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
