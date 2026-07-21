import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface SendFriendRequestInput {
  requesterId: string;
  addresseeId: string;
}

/**
 * Deliberately does not chain .select() -- Postgres enforces SELECT
 * policies on an INSERT's RETURNING output, and the friendships SELECT
 * policy can hide a row from its own inserter (a blocked user requesting
 * their blocker). Requesting the row back would turn that into a "new row
 * violates row-level security policy" error distinguishable from a normal
 * success, leaking blocked status. See the INSERT policy comment in
 * 20260715090500_create_friendships.sql. The caller already has
 * requesterId/addresseeId from its own input, so nothing is lost by not
 * reading the row back.
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: SendFriendRequestInput) => {
      const { error } = await supabase
        .from("friendships")
        .insert({ requester_id: requesterId, addressee_id: addresseeId, status: "pending" });

      if (error) throw error;
    },
    onSuccess: (_data, { requesterId, addresseeId }) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", addresseeId] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendRequests", requesterId] });
    },
  });
}
