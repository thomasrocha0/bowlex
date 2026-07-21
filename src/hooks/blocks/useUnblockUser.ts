import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/** Removes a block. RLS restricts this to the blocker -- the blocked party has no access to the row at all. */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { data, error } = await supabase.from("blocks").delete().eq("id", blockId).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (block) => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers", block.blocker_id] });
    },
  });
}
