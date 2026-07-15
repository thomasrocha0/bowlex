export type { Database, StatsVisibility, FriendshipStatus } from "./database";

export interface GameStats {
  average: number;
  highGame: number;
  highSeries: number;
  strikePercentage: number;
  sparePercentage: number;
  openFramePercentage: number;
}
