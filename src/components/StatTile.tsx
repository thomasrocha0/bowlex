import { StyleSheet, Text, View } from "react-native";
import { statTileColors } from "./statTileColors";

interface StatTileProps {
  /** The headline value, e.g. "185" or "72%". Fits ~5 characters without wrapping. */
  value: string;
  /** A short description of the value. Wraps up to two lines. */
  label: string;
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    backgroundColor: statTileColors.background,
    borderColor: statTileColors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    width: 120
  },
  value: {
    minWidth: 80,
    fontSize: 28,
    fontWeight: "700",
    color: statTileColors.value,
    textAlign: "left",
  },
  label: {
    alignSelf: "flex-end",
    maxWidth: 180,
    fontSize: 11,
    fontWeight: "300",
    color: statTileColors.label,
    paddingHorizontal: 8,
  },
});
