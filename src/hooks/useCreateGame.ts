import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type NewGame = Database["public"]["Tables"]["games"]["Insert"];

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (game: NewGame) => {
      const { data, error } = await supabase.from("games").insert(game).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ["games", game.profile_id] });
    },
  });
}
