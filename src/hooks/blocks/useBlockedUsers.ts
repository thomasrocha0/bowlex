import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/** Users the current user has blocked -- not who has blocked them, which they have no visibility into. */
export function useBlockedUsers(profileId: string) {
  return useQuery({
    queryKey: ["blockedUsers", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*, blocked:profiles!blocks_blocked_id_fkey(*)")
        .eq("blocker_id", profileId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });
}
