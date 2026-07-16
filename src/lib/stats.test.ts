import { calculateStats } from "./stats";
import type { GameWithFrames } from "../types";

function makeGame(id: string, frameRolls: number[][]): GameWithFrames {
  return {
    id,
    profile_id: "profile-1",
    series_id: "series-1",
    game_number: 1,
    created_at: "2026-01-01T00:00:00Z",
    frames: frameRolls.map((rolls, i) => ({
      id: `${id}-frame-${i}`,
      game_id: id,
      frame_number: i + 1,
      rolls,
      created_at: "2026-01-01T00:00:00Z",
    })),
  };
}

const ALL_GUTTER = Array.from({ length: 10 }, () => [0, 0]);
const ONE_STRIKE_THEN_GUTTER = [[10], ...Array.from({ length: 9 }, () => [0, 0])];

describe("calculateStats", () => {
  it("returns zeroed stats when there are no games", () => {
    expect(calculateStats([])).toEqual({
      averageScore: 0,
      highGame: 0,
      averagePins: 0,
      strikePercentage: 0,
      sparePercentage: 0,
      openFramePercentage: 0,
    });
  });

  it("ignores in-progress games that don't have all 10 frames", () => {
    const incomplete = makeGame("g1", [[10], [3, 4]]);
    expect(calculateStats([incomplete])).toEqual({
      averageScore: 0,
      highGame: 0,
      averagePins: 0,
      strikePercentage: 0,
      sparePercentage: 0,
      openFramePercentage: 0,
    });
  });

  it("scores a single gutter game as all zeros except a 100% open rate", () => {
    const game = makeGame("g1", ALL_GUTTER);
    expect(calculateStats([game])).toEqual({
      averageScore: 0,
      highGame: 0,
      averagePins: 0,
      strikePercentage: 0,
      sparePercentage: 0,
      openFramePercentage: 100,
    });
  });

  it("averages across multiple complete games", () => {
    const gutterGame = makeGame("g1", ALL_GUTTER); // score 0
    const strikeGame = makeGame("g2", ONE_STRIKE_THEN_GUTTER); // score 10

    expect(calculateStats([gutterGame, strikeGame])).toEqual({
      averageScore: 5,
      highGame: 10,
      averagePins: 0.5, // 10 total pins / 20 frames
      strikePercentage: 5, // 1 strike / 20 frames
      sparePercentage: 0,
      openFramePercentage: 95, // 19 open frames / 20 frames
    });
  });
});
