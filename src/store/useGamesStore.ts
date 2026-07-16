import { create } from "zustand";
import type { GameWithFrames } from "../types";

/**
 * Holds the signed-in user's full games list once fetched, so upcoming
 * filtering UI (by league, date range, etc.) can slice this in place
 * instead of re-querying Supabase for every filter change.
 */
interface GamesState {
  games: GameWithFrames[];
  setGames: (games: GameWithFrames[]) => void;
}

export const useGamesStore = create<GamesState>((set) => ({
  games: [],
  setGames: (games) => set({ games }),
}));
