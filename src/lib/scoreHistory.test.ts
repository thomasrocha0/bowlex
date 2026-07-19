import { buildScoreHistory, getScoreHistoryTimeDomain, sampleEvenIndices } from "./scoreHistory";
import type { GameWithFrames } from "../types";

const ALL_GUTTER = Array.from({ length: 10 }, () => [0, 0]);
const ONE_STRIKE_THEN_GUTTER = [[10], ...Array.from({ length: 9 }, () => [0, 0])];

function makeGame(id: string, bowledAt: string, frameRolls: number[][]): GameWithFrames {
  return {
    id,
    profile_id: "profile-1",
    series_id: "series-1",
    game_number: 1,
    created_at: bowledAt,
    series: { bowled_at: bowledAt },
    frames: frameRolls.map((rolls, i) => ({
      id: `${id}-frame-${i}`,
      game_id: id,
      frame_number: i + 1,
      rolls,
      created_at: bowledAt,
    })),
  };
}

describe("buildScoreHistory", () => {
  it("returns an empty series when there are no games", () => {
    expect(buildScoreHistory([], "lifetime")).toEqual([]);
  });

  it("excludes in-progress games that don't have all 10 frames", () => {
    const incomplete = makeGame("g1", "2026-01-01T00:00:00Z", [[10], [3, 4]]);
    expect(buildScoreHistory([incomplete], "lifetime")).toEqual([]);
  });

  it("sorts games oldest first regardless of input order", () => {
    const later = makeGame("g1", "2026-02-01T00:00:00Z", ONE_STRIKE_THEN_GUTTER);
    const earlier = makeGame("g2", "2026-01-01T00:00:00Z", ALL_GUTTER);
    const history = buildScoreHistory([later, earlier], "lifetime");
    expect(history.map((p) => p.gameId)).toEqual(["g2", "g1"]);
    expect(history.map((p) => p.score)).toEqual([0, 10]);
  });

  it("last10 keeps only the 10 most recent games", () => {
    const games = Array.from({ length: 12 }, (_, i) =>
      makeGame(`g${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`, ALL_GUTTER)
    );
    const history = buildScoreHistory(games, "last10");
    expect(history).toHaveLength(10);
    expect(history[0].gameId).toBe("g2");
    expect(history[9].gameId).toBe("g11");
  });

  it("lastMonth excludes games older than one month before `now`", () => {
    const inWindow = makeGame("g1", "2026-06-20T00:00:00Z", ALL_GUTTER);
    const outOfWindow = makeGame("g2", "2026-01-01T00:00:00Z", ALL_GUTTER);
    const now = new Date("2026-07-17T00:00:00Z");
    const history = buildScoreHistory([inWindow, outOfWindow], "lastMonth", now);
    expect(history.map((p) => p.gameId)).toEqual(["g1"]);
  });

  it("lastYear excludes games older than one year before `now`", () => {
    const inWindow = makeGame("g1", "2025-08-01T00:00:00Z", ALL_GUTTER);
    const outOfWindow = makeGame("g2", "2025-01-01T00:00:00Z", ALL_GUTTER);
    const now = new Date("2026-07-17T00:00:00Z");
    const history = buildScoreHistory([inWindow, outOfWindow], "lastYear", now);
    expect(history.map((p) => p.gameId)).toEqual(["g1"]);
  });
});

describe("getScoreHistoryTimeDomain", () => {
  const now = new Date("2026-07-17T00:00:00Z");

  it("returns a one-month-ago start for lastMonth", () => {
    const domain = getScoreHistoryTimeDomain("lastMonth", now);
    expect(domain).toEqual({ start: new Date("2026-06-17T00:00:00Z"), end: now });
  });

  it("returns a twelve-month-ago start for lastYear", () => {
    const domain = getScoreHistoryTimeDomain("lastYear", now);
    expect(domain).toEqual({ start: new Date("2025-07-17T00:00:00Z"), end: now });
  });

  it("returns null for count-based timeframes", () => {
    expect(getScoreHistoryTimeDomain("last10", now)).toBeNull();
    expect(getScoreHistoryTimeDomain("last30", now)).toBeNull();
    expect(getScoreHistoryTimeDomain("lifetime", now)).toBeNull();
  });
});

describe("sampleEvenIndices", () => {
  it("returns every index when length is at or under the cap", () => {
    expect(sampleEvenIndices(0)).toEqual([]);
    expect(sampleEvenIndices(5, 10)).toEqual([0, 1, 2, 3, 4]);
    expect(sampleEvenIndices(10, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("always includes the first and last index", () => {
    const indices = sampleEvenIndices(37, 10);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(36);
  });

  it("caps at maxCount and stays evenly spaced", () => {
    const indices = sampleEvenIndices(100, 10);
    expect(indices).toHaveLength(10);
    expect(indices).toEqual([0, 11, 22, 33, 44, 55, 66, 77, 88, 99]);
  });
});
