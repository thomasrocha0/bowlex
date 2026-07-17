import { parseFrameInput, parseGameInput } from "./frameNotation";

describe("parseFrameInput", () => {
  it("reports empty status for no boxes filled", () => {
    expect(parseFrameInput(1, ["", ""])).toEqual({ status: "empty", rolls: [], expectedBoxCount: 2 });
  });

  it("reports incomplete status after a single non-strike digit in frames 1-9", () => {
    const result = parseFrameInput(1, ["4", ""]);
    expect(result.status).toBe("incomplete");
    expect(result.rolls).toEqual([4]);
  });

  it("completes a frame with two rolls summing to 10 or less", () => {
    const result = parseFrameInput(1, ["4", "3"]);
    expect(result).toEqual({ status: "complete", rolls: [4, 3], expectedBoxCount: 2 });
  });

  it("rejects two rolls summing over 10", () => {
    const result = parseFrameInput(1, ["6", "5"]);
    expect(result.status).toBe("invalid");
  });

  it("rejects a digit that exceeds the pins standing", () => {
    const result = parseFrameInput(1, ["6", "5"]);
    expect(result.error).toMatch(/more pins/i);
  });

  it("completes a strike frame after a single box in frames 1-9", () => {
    const result = parseFrameInput(1, ["X", ""]);
    expect(result).toEqual({ status: "complete", rolls: [10], expectedBoxCount: 2 });
  });

  it("resolves a spare via the / shorthand", () => {
    const result = parseFrameInput(1, ["6", "/"]);
    expect(result).toEqual({ status: "complete", rolls: [6, 4], expectedBoxCount: 2 });
  });

  it("rejects / as the first roll of a frame", () => {
    const result = parseFrameInput(1, ["/", ""]);
    expect(result.status).toBe("invalid");
  });

  it("rejects X once pins are already down", () => {
    const result = parseFrameInput(1, ["4", "X"]);
    expect(result.status).toBe("invalid");
  });

  it("10th frame: perfect game boxes resolve as three strikes", () => {
    const result = parseFrameInput(10, ["X", "X", "X"]);
    expect(result).toEqual({ status: "complete", rolls: [10, 10, 10], expectedBoxCount: 3 });
  });

  it("10th frame: strike then partial rolls does not exceed the fresh rack", () => {
    const result = parseFrameInput(10, ["X", "7", "2"]);
    expect(result).toEqual({ status: "complete", rolls: [10, 7, 2], expectedBoxCount: 3 });
  });

  it("10th frame: strike then rolls exceeding the fresh rack are invalid", () => {
    const result = parseFrameInput(10, ["X", "7", "8"]);
    expect(result.status).toBe("invalid");
  });

  it("10th frame: 9 then spare then a fresh bonus roll", () => {
    const result = parseFrameInput(10, ["9", "/", "6"]);
    expect(result).toEqual({ status: "complete", rolls: [9, 1, 6], expectedBoxCount: 3 });
  });

  it("10th frame: open frame needs only two boxes", () => {
    const result = parseFrameInput(10, ["5", "3", ""]);
    expect(result).toEqual({ status: "complete", rolls: [5, 3], expectedBoxCount: 2 });
  });

  it("10th frame: earning a bonus roll but stopping at two boxes is incomplete", () => {
    const result = parseFrameInput(10, ["X", "", ""]);
    expect(result.status).toBe("incomplete");
    expect(result.expectedBoxCount).toBe(3);
  });
});

describe("parseGameInput", () => {
  const emptyFrame = ["", ""];

  it("is not complete when any frame is incomplete", () => {
    const gameBoxChars = [["4", ""], ...Array.from({ length: 9 }, () => emptyFrame)];
    const result = parseGameInput(gameBoxChars);
    expect(result.isComplete).toBe(false);
    expect(result.rolls[0]).toEqual([]);
  });

  it("is not complete when any frame is invalid", () => {
    const gameBoxChars = [["6", "5"], ...Array.from({ length: 9 }, () => emptyFrame)];
    const result = parseGameInput(gameBoxChars);
    expect(result.isComplete).toBe(false);
  });

  it("is complete when all 10 frames resolve, including the 10th's bonus rolls", () => {
    const gameBoxChars = [
      ["X", ""],
      ["7", "2"],
      ["9", "0"],
      ["X", ""],
      ["0", "8"],
      ["8", "2"],
      ["0", "6"],
      ["X", ""],
      ["X", ""],
      ["X", "8", "1"],
    ];
    const result = parseGameInput(gameBoxChars);
    expect(result.isComplete).toBe(true);
    expect(result.rolls[9]).toEqual([10, 8, 1]);
  });
});
