/** Artificial delay for local testing of loading/skeleton states. Remove call sites when done testing. */
export function devDelay(ms: number = 1500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
