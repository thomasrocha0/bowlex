import type { Database } from "./database";

export type { Database };
export type StatsVisibility = Database["public"]["Enums"]["stats_visibility"];
export type FriendshipStatus = Database["public"]["Enums"]["friendship_status"];

export interface GameStats {
  average: number;
  highGame: number;
  highSeries: number;
  strikePercentage: number;
  sparePercentage: number;
  openFramePercentage: number;
}

export type GameRow = Database["public"]["Tables"]["games"]["Row"];
export type FrameRow = Database["public"]["Tables"]["frames"]["Row"];
export type GameWithFrames = GameRow & { frames: FrameRow[] };
