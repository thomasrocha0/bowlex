import { z } from "zod";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, "3-20 characters: lowercase letters, numbers, and underscores only.");

export const passwordSchema = z.string().min(6, "Password must be at least 6 characters.");

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Supabase Auth is email-based; there's no native username identity. Sign-in
 * is username/password only (no magic link, no email delivery), so usernames
 * are mapped to a deterministic, non-deliverable placeholder address instead
 * of a real one. `.invalid` is reserved by RFC 2606 for exactly this case.
 */
export function usernameToAuthEmail(username: string): string {
  return `${username}@users.bowling-tracker.invalid`;
}

/** Translates raw Supabase Auth (or credentialsSchema validation) errors into user-facing messages. */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid username or password.";
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/already registered/i.test(message)) return "That username is already taken.";
  if (/invalid login credentials/i.test(message)) return "Incorrect username or password.";
  if (/profiles_username_key/i.test(message)) return "That username is already taken.";

  return message;
}
