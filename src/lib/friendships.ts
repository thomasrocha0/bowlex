import type { BlockRow, FriendshipRow, FriendshipWithProfiles, ProfileRow, RelationshipStatus } from "../types";

/** The profile on the other side of a friendship row, given who "I" am. */
export function getOtherProfile(friendship: FriendshipWithProfiles, myProfileId: string): ProfileRow {
  const other = friendship.requester_id === myProfileId ? friendship.addressee : friendship.requester;
  if (!other) throw new Error("Friendship row is missing the other party's joined profile");
  return other;
}

function findByOtherParty(rows: FriendshipRow[], targetProfileId: string): FriendshipRow | undefined {
  return rows.find((f) => f.requester_id === targetProfileId || f.addressee_id === targetProfileId);
}

export interface RelationshipLists {
  friends: FriendshipRow[];
  incoming: FriendshipRow[];
  outgoing: FriendshipRow[];
  /** The current user's own blocks -- not blocks placed on them, which they have no visibility into. */
  blocked: BlockRow[];
}

/**
 * Derives the current user's relationship to `targetProfileId` from their
 * friendship lists. Single source of truth for what the manage-friend modal
 * shows, used identically whether the row came from a tab (each list is
 * already homogeneous by construction) or from a global user search (where
 * a result could be any relationship type).
 */
export function getRelationshipStatus(targetProfileId: string, lists: RelationshipLists): RelationshipStatus {
  const friend = findByOtherParty(lists.friends, targetProfileId);
  if (friend) return { type: "friend", friendshipId: friend.id };

  const incoming = findByOtherParty(lists.incoming, targetProfileId);
  if (incoming) return { type: "incomingPending", friendshipId: incoming.id };

  const outgoing = findByOtherParty(lists.outgoing, targetProfileId);
  if (outgoing) return { type: "outgoingPending", friendshipId: outgoing.id };

  const blocked = lists.blocked.find((b) => b.blocked_id === targetProfileId);
  if (blocked) return { type: "blocked", blockId: blocked.id };

  return { type: "none" };
}
