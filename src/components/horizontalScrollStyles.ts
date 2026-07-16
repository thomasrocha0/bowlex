import { StyleSheet } from "react-native";

export function createHorizontalScrollStyles(gap: number) {
  return StyleSheet.create({
    scroll: {
      width: "100%",
    },
    content: {
      flexGrow: 1,
      justifyContent: "space-evenly",
      alignItems: "center",
      gap,
      paddingHorizontal: gap,
    },
  });
}
