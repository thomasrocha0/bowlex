import { calculateFrameScores, calculateGameScore, validateFrame } from "./scoring";

describe("calculateGameScore", () => {
  it("scores a gutter game as 0", () => {
    const frames = Array.from({ length: 10 }, () => [0, 0]);
    expect(calculateGameScore(frames)).toBe(0);
  });

  it("scores a game with no strikes or spares as the sum of pins knocked down", () => {
    const frames = Array.from({ length: 10 }, () => [5, 4]);
    expect(calculateGameScore(frames)).toBe(90);
  });

  it("scores a single strike with correct bonus lookahead", () => {
    const frames = [
      [10],
      [3, 4],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    // frame 1: 10 + 3 + 4 = 17, frame 2: 3 + 4 = 7
    expect(calculateGameScore(frames)).toBe(24);
  });

  it("scores a spare with correct bonus lookahead", () => {
    const frames = [
      [5, 5],
      [3, 4],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    // frame 1: 10 + 3 = 13, frame 2: 3 + 4 = 7
    expect(calculateGameScore(frames)).toBe(20);
  });

  it("scores a perfect game as 300", () => {
    const frames = [
      [10],
      [10],
      [10],
      [10],
      [10],
      [10],
      [10],
      [10],
      [10],
      [10, 10, 10],
    ];
    expect(calculateGameScore(frames)).toBe(300);
  });

  it("scores a 10th-frame spare with a single bonus roll", () => {
    const frames = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [5, 5, 7],
    ];
    expect(calculateGameScore(frames)).toBe(17);
  });

  it("scores a 10th-frame strike with two bonus rolls", () => {
    const frames = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [10, 7, 2],
    ];
    expect(calculateGameScore(frames)).toBe(19);
  });

  it("scores a game with mixed strikes, spares, and open frames correctly", () => {
    const frames = [
      [10],
      [7, 3],
      [9, 0],
      [10],
      [0, 8],
      [8, 2],
      [0, 6],
      [10],
      [10],
      [10, 8, 1],
    ];
    // frame scores: 20 + 19 + 9 + 18 + 8 + 10 + 6 + 30 + 28 + 19 = 167
    expect(calculateGameScore(frames)).toBe(167);
  });

  it("scores a spare with correct bonus lookahead", () => {
    const frames = [
      [5, 5],
      [0, 4],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    // frame 1: 10 + 0 = 10, frame 2: 0 + 4 = 4
    expect(calculateGameScore(frames)).toBe(14);
  });
});

describe("calculateFrameScores", () => {
  it("matches calculateGameScore's total at the 10th frame for a complete game", () => {
    const frames = [
      [10],
      [7, 3],
      [9, 0],
      [10],
      [0, 8],
      [8, 2],
      [0, 6],
      [10],
      [10],
      [10, 8, 1],
    ];
    const scores = calculateFrameScores(frames);
    expect(scores).toHaveLength(10);
    expect(scores.every((score) => score !== null)).toBe(true);
    expect(scores[9]).toBe(calculateGameScore(frames));
  });

  it("returns null from a 9th-frame strike onward when the 10th frame isn't entered yet", () => {
    const frames = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [10],
      [],
    ];
    const scores = calculateFrameScores(frames);
    expect(scores.slice(0, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(scores[8]).toBeNull();
    expect(scores[9]).toBeNull();
  });

  it("resolves every frame immediately for a game with no marks", () => {
    const frames = Array.from({ length: 10 }, () => [5, 4]);
    const scores = calculateFrameScores(frames);
    expect(scores).toEqual([9, 18, 27, 36, 45, 54, 63, 72, 81, 90]);
  });
});

describe("validateFrame", () => {
  it("accepts a strike in frames 1-9", () => {
    expect(validateFrame(1, [10])).toEqual({ valid: true });
  });

  it("rejects rolls summing over 10 in a non-10th frame", () => {
    expect(validateFrame(1, [6, 5]).valid).toBe(false);
  });

  it("rejects an individual roll outside 0-10", () => {
    expect(validateFrame(1, [11, 0]).valid).toBe(false);
  });

  it("requires a 3rd roll in the 10th frame after a strike", () => {
    expect(validateFrame(10, [10, 4]).valid).toBe(false);
    expect(validateFrame(10, [10, 4, 5]).valid).toBe(true);
  });

  it("requires a 3rd roll in the 10th frame after a spare", () => {
    expect(validateFrame(10, [5, 5]).valid).toBe(false);
    expect(validateFrame(10, [5, 5, 8]).valid).toBe(true);
  });

  it("accepts a plain (non-bonus) 10th frame with exactly 2 rolls", () => {
    expect(validateFrame(10, [4, 3]).valid).toBe(true);
  });

  it("rejects a 3rd 10th-frame roll without an earned bonus", () => {
    expect(validateFrame(10, [4, 3, 2]).valid).toBe(false);
  });
});
