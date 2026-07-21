import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ProfileRow } from "../../types";
import { friendRowColors } from "./friendRowColors";

interface FriendRowProps {
  profile: ProfileRow;
  /** Injected by the parent -- this component owns no click behavior of its own. */
  onPress: () => void;
}

/** Presentational only. What happens on tap is entirely up to the caller. */
export function FriendRow({ profile, onPress }: FriendRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.username}>{profile.username}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: friendRowColors.border,
  },
  username: { fontSize: 15, fontWeight: "600", color: friendRowColors.username },
  chevron: { fontSize: 18, color: friendRowColors.chevron },
});
