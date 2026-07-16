import { calculateGameScore, isSpare, isStrike } from "./scoring";
import type { GameWithFrames } from "../types";

export interface GameStatsSummary {
  averageScore: number;
  highGame: number;
  averagePins: number;
  strikePercentage: number;
  sparePercentage: number;
  openFramePercentage: number;
}

const EMPTY_STATS: GameStatsSummary = {
  averageScore: 0,
  highGame: 0,
  averagePins: 0,
  strikePercentage: 0,
  sparePercentage: 0,
  openFramePercentage: 0,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function framePinfall(rolls: number[]): number {
  return isStrike(rolls, 0) ? 10 : (rolls[0] ?? 0) + (rolls[1] ?? 0);
}

function sortedRolls(game: GameWithFrames): number[][] {
  return [...game.frames].sort((a, b) => a.frame_number - b.frame_number).map((frame) => frame.rolls);
}

/**
 * Aggregates games into the headline stats shown on the stats screen.
 * Only complete games (10 frames) are counted — an in-progress game has no
 * final score yet. Strike/spare/open-frame classification mirrors the
 * per-frame logic in the get_friend_stats Postgres function, so the owner's
 * own view and a friend's view agree on how each stat is defined.
 */
export function calculateStats(games: GameWithFrames[]): GameStatsSummary {
  const completeGames = games.filter((game) => game.frames.length === 10);
  if (completeGames.length === 0) return EMPTY_STATS;

  const gameFrames = completeGames.map(sortedRolls);
  const scores = gameFrames.map(calculateGameScore);
  const allFrames = gameFrames.flat();

  const strikeCount = allFrames.filter((rolls) => isStrike(rolls, 0)).length;
  const spareCount = allFrames.filter((rolls) => isSpare(rolls, 0)).length;
  const openCount = allFrames.length - strikeCount - spareCount;
  const totalPins = allFrames.reduce((sum, rolls) => sum + framePinfall(rolls), 0);

  return {
    averageScore: round1(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    highGame: Math.max(...scores),
    averagePins: round1(totalPins / allFrames.length),
    strikePercentage: round1((100 * strikeCount) / allFrames.length),
    sparePercentage: round1((100 * spareCount) / allFrames.length),
    openFramePercentage: round1((100 * openCount) / allFrames.length),
  };
}
