import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSignOut } from "../../hooks/auth/useSignOut";

export function ProfileScreen() {
  const signOut = useSignOut();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.button} disabled={signOut.isPending} onPress={() => signOut.mutate()}>
        <Text style={styles.buttonText}>{signOut.isPending ? "Signing out..." : "Sign Out"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { fontSize: 20, fontWeight: "600" },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
