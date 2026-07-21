import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Palette } from "../../components/Palette";
import {
  FriendsTable,
  type FriendsTableMode,
  type FriendsTableRow,
} from "../../components/social/FriendsTable";
import { friendsTableColors } from "../../components/social/friendsTableColors";
import { ManageFriendModal } from "../../components/social/ManageFriendModal";
import { SearchBar } from "../../components/social/SearchBar";
import { Tabs } from "../../components/social/Tabs";
import { useBlockedUsers } from "../../hooks/blocks/useBlockedUsers";
import { useFriendRequests } from "../../hooks/friendships/useFriendRequests";
import { useFriends } from "../../hooks/friendships/useFriends";
import { useOutgoingFriendRequests } from "../../hooks/friendships/useOutgoingFriendRequests";
import { useSearchUsers } from "../../hooks/profiles/useSearchUsers";
import { useSession } from "../../hooks/auth/useSession";
import { getOtherProfile, getRelationshipStatus } from "../../lib/friendships";
import type { BlockWithProfile, FriendshipRow } from "../../types";

type MainTab = "friends" | "pending" | "blocked";

const MAIN_TABS: { value: MainTab; label: string }[] = [
  { value: "friends", label: "Friends" },
  { value: "pending", label: "Pending" },
  { value: "blocked", label: "Blocked" },
];

function toRows(
  friendships: FriendshipRow[],
  myProfileId: string,
  relationship: (id: string) => FriendsTableRow["relationship"],
) {
  return friendships.map((f) => ({
    profile: getOtherProfile(f, myProfileId),
    relationship: relationship(f.id),
  }));
}

/** Blocks aren't symmetric like a friendship row, so this maps off the joined `blocked` profile instead of getOtherProfile. */
function toBlockedRows(blocks: BlockWithProfile[]): FriendsTableRow[] {
  return blocks.flatMap((b) =>
    b.blocked
      ? [
          {
            profile: b.blocked,
            relationship: { type: "blocked" as const, blockId: b.id },
          },
        ]
      : [],
  );
}

function matchesFilter(row: FriendsTableRow, filter: string) {
  return row.profile.username
    .toLowerCase()
    .includes(filter.trim().toLowerCase());
}

export function FriendsScreen() {
  const { session } = useSession();
  const profileId = session?.user.id ?? "";

  const [mainTab, setMainTab] = useState<MainTab>("friends");
  const [tableFilter, setTableFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState<FriendsTableRow | null>(null);

  const friends = useFriends(profileId);
  const incoming = useFriendRequests(profileId);
  const outgoing = useOutgoingFriendRequests(profileId);
  const blocked = useBlockedUsers(profileId);
  const search = useSearchUsers(searchQuery, profileId);

  const showSearchResults = searchQuery.trim().length > 0;

  const relationshipLists = useMemo(
    () => ({
      friends: friends.data ?? [],
      incoming: incoming.data ?? [],
      outgoing: outgoing.data ?? [],
      blocked: blocked.data ?? [],
    }),
    [friends.data, incoming.data, outgoing.data, blocked.data],
  );

  const searchRows: FriendsTableRow[] = useMemo(
    () =>
      (search.data ?? []).map((profile) => ({
        profile,
        relationship: getRelationshipStatus(profile.id, relationshipLists),
      })),
    [search.data, relationshipLists],
  );

  const { rows, mode, isLoading } = useMemo(() => {
    if (mainTab === "friends") {
      const friendRows = toRows(
        relationshipLists.friends,
        profileId,
        (friendshipId) => ({ type: "friend", friendshipId }),
      );
      return {
        rows: friendRows.filter((r) => matchesFilter(r, tableFilter)),
        mode: "friends" as FriendsTableMode,
        isLoading: friends.isLoading,
      };
    }

    if (mainTab === "blocked") {
      const blockedRows = toBlockedRows(relationshipLists.blocked);
      return {
        rows: blockedRows.filter((r) => matchesFilter(r, tableFilter)),
        mode: "blocked" as FriendsTableMode,
        isLoading: blocked.isLoading,
      };
    }

    return {
      rows: [],
      mode: "pendingIncoming" as FriendsTableMode,
      isLoading: incoming.isLoading || outgoing.isLoading,
    };
  }, [
    mainTab,
    relationshipLists,
    profileId,
    tableFilter,
    friends.isLoading,
    blocked.isLoading,
    incoming.isLoading,
    outgoing.isLoading,
  ]);

  const pendingRows = useMemo(() => {
    const incomingRows = toRows(
      relationshipLists.incoming,
      profileId,
      (friendshipId) => ({ type: "incomingPending", friendshipId }),
    );
    const outgoingRows = toRows(
      relationshipLists.outgoing,
      profileId,
      (friendshipId) => ({ type: "outgoingPending", friendshipId }),
    );

    return {
      incoming: incomingRows.filter((r) => matchesFilter(r, tableFilter)),
      outgoing: outgoingRows.filter((r) => matchesFilter(r, tableFilter)),
    };
  }, [
    relationshipLists.incoming,
    relationshipLists.outgoing,
    profileId,
    tableFilter,
  ]);

  return (
    // Tapping anywhere outside the search bar/dropdown dismisses it -- nested
    // Touchables (rows, tabs, buttons) claim the touch for themselves via
    // RN's responder system, so this only fires for taps that land on empty
    // space. Deliberately not blur-based: submitting via the keyboard's
    // return key also blurs the input on most platforms, which made the
    // dropdown flash open and immediately close again.
    <Pressable style={styles.container} onPress={() => setSearchQuery("")}>
      <View style={styles.searchWrapper}>
        <Text style={styles.tableTitle}>Find Users</Text>
        <SearchBar
          value={globalSearch}
          onChangeText={setGlobalSearch}
          onSubmit={() => setSearchQuery(globalSearch)}
          placeholder="Find new users..."
        />

        {showSearchResults && (
          <View style={styles.searchOverlay}>
            <FriendsTable rows={searchRows} mode="search" onSelectRow={setSelectedRow} isLoading={search.isLoading} />
          </View>
        )}
      </View>

      <View style={styles.tabsRow}>
        <View style={styles.tabsColumn}>
          <Tabs options={MAIN_TABS} value={mainTab} onChange={setMainTab} />
        </View>
        <SearchBar
          value={tableFilter}
          onChangeText={setTableFilter}
          placeholder="Filter..."
        />
      </View>

      {mainTab === "pending" ? (
        <View style={styles.pendingTables}>
          <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>Incoming Requests</Text>
            <FriendsTable
              rows={pendingRows.incoming}
              mode="pendingIncoming"
              onSelectRow={setSelectedRow}
              isLoading={incoming.isLoading}
            />
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>Outgoing Requests</Text>
            <FriendsTable
              rows={pendingRows.outgoing}
              mode="pendingOutgoing"
              onSelectRow={setSelectedRow}
              isLoading={outgoing.isLoading}
            />
          </View>
        </View>
      ) : (
        <FriendsTable rows={rows} mode={mode} onSelectRow={setSelectedRow} isLoading={isLoading} />
      )}

      <ManageFriendModal
        visible={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        profile={selectedRow?.profile ?? null}
        relationship={selectedRow?.relationship ?? { type: "none" }}
        myProfileId={profileId}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette["grey-50"],
    padding: 16,
    gap: 12,
  },
  searchWrapper: { 
    zIndex: 20, 
    flexDirection: "row" , 
    gap: 12, 
    alignItems: "center" 
  },
  searchOverlay: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    maxHeight: 280,
    zIndex: 20,
    elevation: 6,
    backgroundColor: friendsTableColors.background,
    borderColor: friendsTableColors.border,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tabsColumn: { gap: 8 },
  pendingTables: { flex: 1, gap: 12 },
  tableSection: { flex: 1, gap: 8, minHeight: 0 },
  tableTitle: { fontSize: 14, fontWeight: "700", color: Palette["grey-700"] },
});
