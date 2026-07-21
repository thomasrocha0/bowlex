import { ScrollView, StyleSheet, Text } from "react-native";
import type { ProfileRow, RelationshipStatus } from "../../types";
import { FriendRow } from "./FriendRow";
import { FriendRowSkeleton } from "../skeletons/FriendRowSkeleton";
import { friendsTableColors } from "./friendsTableColors";

export type FriendsTableMode =
  | "friends"
  | "pendingIncoming"
  | "pendingOutgoing"
  | "blocked"
  | "search";

export interface FriendsTableRow {
  profile: ProfileRow;
  relationship: RelationshipStatus;
}

interface FriendsTableProps {
  rows: FriendsTableRow[];
  mode: FriendsTableMode;
  onSelectRow: (row: FriendsTableRow) => void;
  isLoading?: boolean;
}

const EMPTY_MESSAGES: Record<FriendsTableMode, string> = {
  friends: "No friends yet -- search above to add one.",
  pendingIncoming: "No incoming requests.",
  pendingOutgoing: "No outgoing requests.",
  blocked: "No blocked users.",
  search: "No users found.",
};

const SKELETON_ROW_COUNT = 5;

/** Takes a collection of user data + a mode, and renders a row per user. */
export function FriendsTable({
  rows,
  mode,
  onSelectRow,
  isLoading,
}: FriendsTableProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {isLoading ? (
        Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <FriendRowSkeleton key={index} />
        ))
      ) : (
        <>
          {rows.length === 0 && (
            <Text style={styles.empty}>{EMPTY_MESSAGES[mode]}</Text>
          )}
          {rows.map((row) => (
            <FriendRow
              key={row.profile.id}
              profile={row.profile}
              onPress={() => onSelectRow(row)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: friendsTableColors.background,
    borderColor: friendsTableColors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  empty: {
    color: friendsTableColors.empty,
    textAlign: "center",
    marginTop: 24,
  },
});
