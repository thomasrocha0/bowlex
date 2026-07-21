import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/** Pending friend requests addressed to the current user. */
export function useFriendRequests(profileId: string) {
  return useQuery({
    queryKey: ["friendRequests", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*, requester:requester_id(*)")
        .eq("status", "pending")
        .eq("addressee_id", profileId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });
}
