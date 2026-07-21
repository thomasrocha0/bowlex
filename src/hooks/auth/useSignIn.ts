import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { credentialsSchema, usernameToAuthEmail, type Credentials } from "../../lib/auth";

export function useSignIn() {
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { username, password } = credentialsSchema.parse(credentials);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToAuthEmail(username),
        password,
      });

      if (error) throw error;
      return data;
    },
  });
}
