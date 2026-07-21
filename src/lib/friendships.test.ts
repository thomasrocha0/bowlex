import { getOtherProfile, getRelationshipStatus, type RelationshipLists } from "./friendships";
import type { BlockRow, FriendshipRow, FriendshipWithProfiles, ProfileRow } from "../types";

function makeProfile(id: string, username: string): ProfileRow {
  return { id, username, display_name: username, avatar_url: null, stats_visibility: "friends_only", created_at: "2026-07-01T00:00:00.000Z" };
}

function makeFriendship(id: string, requesterId: string, addresseeId: string): FriendshipRow {
  return {
    id,
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
}

function makeBlock(id: string, blockerId: string, blockedId: string): BlockRow {
  return { id, blocker_id: blockerId, blocked_id: blockedId, created_at: "2026-07-01T00:00:00.000Z" };
}

const me = makeProfile("me", "me");
const alice = makeProfile("alice", "alice");
const bob = makeProfile("bob", "bob");

describe("getOtherProfile", () => {
  it("returns the addressee when I'm the requester", () => {
    const friendship: FriendshipWithProfiles = { ...makeFriendship("f1", "me", "alice"), addressee: alice };
    expect(getOtherProfile(friendship, "me")).toBe(alice);
  });

  it("returns the requester when I'm the addressee", () => {
    const friendship: FriendshipWithProfiles = { ...makeFriendship("f1", "alice", "me"), requester: alice };
    expect(getOtherProfile(friendship, "me")).toBe(alice);
  });

  it("throws when the other party's profile wasn't embedded", () => {
    const friendship: FriendshipWithProfiles = makeFriendship("f1", "me", "alice");
    expect(() => getOtherProfile(friendship, "me")).toThrow();
  });
});

describe("getRelationshipStatus", () => {
  const emptyLists: RelationshipLists = { friends: [], incoming: [], outgoing: [], blocked: [] };

  it("returns 'none' when there's no friendship row with the target", () => {
    expect(getRelationshipStatus("alice", emptyLists)).toEqual({ type: "none" });
  });

  it("returns 'friend' when the target is in the friends list, regardless of direction", () => {
    const asRequester = makeFriendship("f1", "me", "alice");
    expect(getRelationshipStatus("alice", { ...emptyLists, friends: [asRequester] })).toEqual({
      type: "friend",
      friendshipId: "f1",
    });

    const asAddressee = makeFriendship("f2", "alice", "me");
    expect(getRelationshipStatus("alice", { ...emptyLists, friends: [asAddressee] })).toEqual({
      type: "friend",
      friendshipId: "f2",
    });
  });

  it("returns 'incomingPending' when the target sent me a request", () => {
    const incoming = makeFriendship("f1", "alice", "me");
    expect(getRelationshipStatus("alice", { ...emptyLists, incoming: [incoming] })).toEqual({
      type: "incomingPending",
      friendshipId: "f1",
    });
  });

  it("returns 'outgoingPending' when I sent the target a request", () => {
    const outgoing = makeFriendship("f1", "me", "alice");
    expect(getRelationshipStatus("alice", { ...emptyLists, outgoing: [outgoing] })).toEqual({
      type: "outgoingPending",
      friendshipId: "f1",
    });
  });

  it("returns 'blocked' when the target is in my own blocked list", () => {
    const block = makeBlock("b1", "me", "alice");
    expect(getRelationshipStatus("alice", { ...emptyLists, blocked: [block] })).toEqual({
      type: "blocked",
      blockId: "b1",
    });
  });

  it("only matches rows involving the target, not unrelated rows in the same list", () => {
    const withBob = makeFriendship("f1", "me", "bob");
    expect(getRelationshipStatus("alice", { ...emptyLists, friends: [withBob] })).toEqual({ type: "none" });
  });
});
