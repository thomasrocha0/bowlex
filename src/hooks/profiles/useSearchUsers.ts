import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

const RESULT_LIMIT = 20;

/** Searches profiles by username prefix/substring, excluding the current user. */
export function useSearchUsers(query: string, excludeProfileId: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["searchUsers", trimmed, excludeProfileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${trimmed}%`)
        .neq("id", excludeProfileId)
        .order("username")
        .limit(RESULT_LIMIT);

      if (error) throw error;
      return data;
    },
    enabled: trimmed.length > 0 && Boolean(excludeProfileId),
  });
}
