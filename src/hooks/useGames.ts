import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useGames(profileId: string) {
  return useQuery({
    queryKey: ["games", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*, frames(*), series(bowled_at)")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });
}
