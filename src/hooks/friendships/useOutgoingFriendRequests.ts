import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/** Pending friend requests sent by the current user, awaiting the other party. */
export function useOutgoingFriendRequests(profileId: string) {
  return useQuery({
    queryKey: ["outgoingFriendRequests", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*, addressee:addressee_id(*)")
        .eq("status", "pending")
        .eq("requester_id", profileId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });
}
