import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { FriendshipStatus } from "../types";

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      friendshipId,
      status,
    }: {
      friendshipId: string;
      status: Extract<FriendshipStatus, "accepted" | "declined">;
    }) => {
      const { data, error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", friendshipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (friendship) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", friendship.addressee_id] });
      queryClient.invalidateQueries({ queryKey: ["friends", friendship.addressee_id] });
      queryClient.invalidateQueries({ queryKey: ["friends", friendship.requester_id] });
    },
  });
}
