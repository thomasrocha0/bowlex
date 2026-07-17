import { sortGames } from "./gamesSort";
import type { GameWithFrames } from "../types";

function makeGame(id: string, rolls: number[][], bowledAt: string): GameWithFrames {
  return {
    id,
    series_id: "series-1",
    profile_id: "profile-1",
    game_number: 1,
    created_at: bowledAt,
    series: { bowled_at: bowledAt },
    frames: rolls.map((frameRolls, index) => ({
      id: `${id}-frame-${index + 1}`,
      game_id: id,
      frame_number: index + 1,
      rolls: frameRolls,
      created_at: bowledAt,
    })),
  };
}

const gutterGame = () => Array.from({ length: 10 }, () => [0, 0]);
const noMarkGame = () => Array.from({ length: 10 }, () => [5, 4]); // score 90

describe("sortGames", () => {
  const low = makeGame("low", gutterGame(), "2026-07-01T00:00:00.000Z"); // score 0
  const mid = makeGame("mid", noMarkGame(), "2026-07-10T00:00:00.000Z"); // score 90
  const high = makeGame(
    "high",
    [[10], [10], [10], [10], [10], [10], [10], [10], [10], [10, 10, 10]],
    "2026-07-05T00:00:00.000Z"
  ); // score 300

  it("sorts highScore descending", () => {
    expect(sortGames([low, mid, high], "highScore").map((g) => g.id)).toEqual(["high", "mid", "low"]);
  });

  it("sorts lowScore ascending", () => {
    expect(sortGames([high, mid, low], "lowScore").map((g) => g.id)).toEqual(["low", "mid", "high"]);
  });

  it("sorts mostRecent by bowled_at descending", () => {
    expect(sortGames([low, mid, high], "mostRecent").map((g) => g.id)).toEqual(["mid", "high", "low"]);
  });

  it("sorts leastRecent by bowled_at ascending", () => {
    expect(sortGames([high, mid, low], "leastRecent").map((g) => g.id)).toEqual(["low", "high", "mid"]);
  });

  it("preserves original relative order for tied scores", () => {
    const tiedA = makeGame("tiedA", noMarkGame(), "2026-07-01T00:00:00.000Z");
    const tiedB = makeGame("tiedB", noMarkGame(), "2026-07-02T00:00:00.000Z");
    expect(sortGames([tiedA, tiedB], "highScore").map((g) => g.id)).toEqual(["tiedA", "tiedB"]);
    expect(sortGames([tiedB, tiedA], "highScore").map((g) => g.id)).toEqual(["tiedB", "tiedA"]);
  });
});
