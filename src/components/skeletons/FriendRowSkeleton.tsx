import { StyleSheet, View } from "react-native";
import { Skeleton } from "./Skeleton";
import { friendRowColors } from "../social/friendRowColors";

/** Placeholder shown in place of FriendRow while its data is still loading. */
export function FriendRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={'100%'} height={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
