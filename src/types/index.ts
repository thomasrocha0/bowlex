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
export type GameWithFrames = GameRow & {
  frames: FrameRow[];
  series: { bowled_at: string } | null;
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type FriendshipRow = Database["public"]["Tables"]["friendships"]["Row"];
/** A friendship row as returned by the hooks that embed one or both parties' profiles. */
export type FriendshipWithProfiles = FriendshipRow & {
  requester?: ProfileRow;
  addressee?: ProfileRow;
};

export type BlockRow = Database["public"]["Tables"]["blocks"]["Row"];
/** A block row as returned by useBlockedUsers, with the blocked party's profile embedded. */
export type BlockWithProfile = BlockRow & {
  blocked?: ProfileRow;
};

/** The current user's relationship to some other profile, and the row backing it (if any). */
export type RelationshipStatus =
  | { type: "friend"; friendshipId: string }
  | { type: "incomingPending"; friendshipId: string }
  | { type: "outgoingPending"; friendshipId: string }
  | { type: "blocked"; blockId: string }
  | { type: "none" };
