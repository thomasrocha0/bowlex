import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/** Accepted friendships for the current user, joined against the other party's profile. */
export function useFriends(profileId: string) {
  return useQuery({
    queryKey: ["friends", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*, requester:requester_id(*), addressee:addressee_id(*)")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });
}
