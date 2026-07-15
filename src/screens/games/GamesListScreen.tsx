import { StyleSheet, Text, View } from "react-native";

export function GamesListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Games</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "600" },
});
