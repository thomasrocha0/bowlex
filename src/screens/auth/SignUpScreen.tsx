import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ZodError } from "zod";
import { useSignUp } from "../../hooks/auth/useSignUp";
import { credentialsSchema, getAuthErrorMessage } from "../../lib/auth";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const signUp = useSignUp();

  function handleSubmit() {
    setValidationError(null);
    const result = credentialsSchema.safeParse({ username, password });
    if (!result.success) {
      const firstIssue = (result.error as ZodError).issues[0];
      setValidationError(firstIssue?.message ?? "Invalid username or password.");
      return;
    }
    signUp.mutate(result.data);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {validationError && <Text style={styles.error}>{validationError}</Text>}
      {signUp.isError && <Text style={styles.error}>{getAuthErrorMessage(signUp.error)}</Text>}

      <TouchableOpacity style={styles.button} disabled={signUp.isPending} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{signUp.isPending ? "Signing up..." : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { color: "#2563eb", marginTop: 8 },
  error: { color: "#dc2626", alignSelf: "flex-start" },
});
