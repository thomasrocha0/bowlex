import { calculateGameScore } from "./scoring";
import { sortedRolls } from "./stats";
import type { GameWithFrames } from "../types";

export type ScoreHistoryTimeframe = "last10" | "last30" | "lastMonth" | "lastYear" | "lifetime";

export const SCORE_HISTORY_TIMEFRAME_OPTIONS: { value: ScoreHistoryTimeframe; label: string }[] = [
  { value: "last10", label: "Last 10 Games" },
  { value: "last30", label: "Last 30 Games" },
  { value: "lastMonth", label: "Last Month" },
  { value: "lastYear", label: "Last Year" },
  { value: "lifetime", label: "Lifetime" },
];

export interface ScoreHistoryPoint {
  gameId: string;
  date: string;
  score: number;
}

function bowledAt(game: GameWithFrames): string {
  return game.series?.bowled_at ?? game.created_at;
}

function monthsAgo(from: Date, months: number): Date {
  const date = new Date(from);
  date.setMonth(date.getMonth() - months);
  return date;
}

export interface ScoreHistoryTimeDomain {
  start: Date;
  end: Date;
}

/**
 * The fixed calendar window a timeframe's x-axis should span, or null for
 * timeframes (last10/last30/lifetime) that are bounded by game count rather
 * than a fixed span -- those position points evenly by index instead.
 */
export function getScoreHistoryTimeDomain(
  timeframe: ScoreHistoryTimeframe,
  now: Date = new Date()
): ScoreHistoryTimeDomain | null {
  switch (timeframe) {
    case "lastMonth":
      return { start: monthsAgo(now, 1), end: now };
    case "lastYear":
      return { start: monthsAgo(now, 12), end: now };
    default:
      return null;
  }
}

/**
 * Games within a timeframe, oldest first. Only complete games count (mirrors
 * calculateStats' "10 frames or it didn't happen" rule), and the timeframe
 * filter is applied after sorting so last10/last30 always keep the most
 * recent games rather than an arbitrary slice. Shared by the score history
 * chart and the stat tiles so both agree on what's in a given timeframe.
 */
export function filterGamesByTimeframe(
  games: GameWithFrames[],
  timeframe: ScoreHistoryTimeframe,
  now: Date = new Date()
): GameWithFrames[] {
  const complete = games.filter((game) => game.frames.length === 10).sort((a, b) => bowledAt(a).localeCompare(bowledAt(b)));

  switch (timeframe) {
    case "last10":
      return complete.slice(-10);
    case "last30":
      return complete.slice(-30);
    case "lastMonth":
    case "lastYear": {
      const { start } = getScoreHistoryTimeDomain(timeframe, now)!;
      return complete.filter((game) => new Date(bowledAt(game)) >= start);
    }
    case "lifetime":
      return complete;
  }
}

/** Score-over-time series for the chart, oldest first. */
export function buildScoreHistory(
  games: GameWithFrames[],
  timeframe: ScoreHistoryTimeframe,
  now: Date = new Date()
): ScoreHistoryPoint[] {
  return filterGamesByTimeframe(games, timeframe, now).map((game) => ({
    gameId: game.id,
    date: bowledAt(game),
    score: calculateGameScore(sortedRolls(game)),
  }));
}

/**
 * Picks up to `maxCount` indices from a series of `length` points, evenly
 * spaced and always including the first and last point. Used to cap how
 * many datapoints get hover/tap tooltips, since rendering a hit target per
 * game gets crowded once a timeframe has dozens of games.
 */
export function sampleEvenIndices(length: number, maxCount: number = 10): number[] {
  if (length <= 0) return [];
  if (length <= maxCount || maxCount <= 1) {
    return Array.from({ length }, (_, i) => i);
  }

  const indices = new Set<number>();
  for (let i = 0; i < maxCount; i++) {
    indices.add(Math.round((i * (length - 1)) / (maxCount - 1)));
  }
  return Array.from(indices).sort((a, b) => a - b);
}
