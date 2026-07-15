import { create } from "zustand";

/**
 * In-progress frame entry for a game being bowled right now — local UI state
 * only. Frames move to Supabase (via useCreateGame / a frames mutation) once
 * the game is complete, not on every roll.
 */
interface GameDraftState {
  frames: number[][];
  recordRoll: (frameIndex: number, pins: number) => void;
  resetDraft: () => void;
}

export const useGameDraftStore = create<GameDraftState>((set) => ({
  frames: Array.from({ length: 10 }, () => []),
  recordRoll: (frameIndex, pins) =>
    set((state) => {
      const frames = state.frames.map((rolls, i) => (i === frameIndex ? [...rolls, pins] : rolls));
      return { frames };
    }),
  resetDraft: () => set({ frames: Array.from({ length: 10 }, () => []) }),
}));
