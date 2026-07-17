import { calculateGameScore } from "./scoring";
import { sortedRolls } from "./stats";
import type { GameWithFrames } from "../types";

export type GamesSortOption = "highScore" | "lowScore" | "mostRecent" | "leastRecent";

function bowledAt(game: GameWithFrames): string {
  return game.series?.bowled_at ?? game.created_at;
}

/**
 * Scores aren't stored (computed on read per CLAUDE.md), so sorting by score
 * happens client-side after fetching. Native Array#sort is stable, so games
 * tied on the sort key keep their original relative order.
 */
export function sortGames(games: GameWithFrames[], sort: GamesSortOption): GameWithFrames[] {
  const sorted = [...games];

  switch (sort) {
    case "highScore":
      return sorted.sort((a, b) => calculateGameScore(sortedRolls(b)) - calculateGameScore(sortedRolls(a)));
    case "lowScore":
      return sorted.sort((a, b) => calculateGameScore(sortedRolls(a)) - calculateGameScore(sortedRolls(b)));
    case "mostRecent":
      return sorted.sort((a, b) => bowledAt(b).localeCompare(bowledAt(a)));
    case "leastRecent":
      return sorted.sort((a, b) => bowledAt(a).localeCompare(bowledAt(b)));
  }
}
