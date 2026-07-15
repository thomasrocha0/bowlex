import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { data, error } = await supabase
        .from("friendships")
        .insert({ requester_id: requesterId, addressee_id: addresseeId, status: "pending" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (friendship) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", friendship.addressee_id] });
    },
  });
}
