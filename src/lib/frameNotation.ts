import { validateFrame } from "./scoring";

const PINS = 10;
const FRAMES_PER_GAME = 10;

/** A single frame box may only ever contain one of these characters. */
export const FRAME_BOX_CHAR_PATTERN = /^[0-9X/]$/;

export type FrameInputStatus = "empty" | "incomplete" | "complete" | "invalid";

export interface FrameInputParseResult {
  status: FrameInputStatus;
  /** Numeric rolls decoded from the boxes filled so far (partial when incomplete/invalid). */
  rolls: number[];
  /**
   * How many boxes this frame's UI has room for: always 2 for frames 1-9,
   * and 2 or 3 for the 10th depending on whether a bonus roll has been
   * earned yet. Note a resolved strike in frames 1-9 leaves `rolls.length`
   * below this (1 roll, 2 boxes) — the caller should disable rather than
   * require the trailing box once `status` is "complete".
   */
  expectedBoxCount: number;
  error?: string;
}

export interface GameInputParseResult {
  /** Always length 10, one result per frame. */
  frames: FrameInputParseResult[];
  isComplete: boolean;
  /** Per-frame numeric rolls; an empty array for any frame that isn't complete. */
  rolls: number[][];
}

function frameBoxCount(frameNumber: number, rolls: number[]): number {
  if (frameNumber !== FRAMES_PER_GAME) return 2;
  const earnedBonusRoll = rolls[0] === PINS || (rolls.length >= 2 && rolls[0] + rolls[1] === PINS);
  return earnedBonusRoll ? 3 : 2;
}

function isFrameResolved(frameNumber: number, rolls: number[]): boolean {
  if (rolls.length === 0) return false;

  if (frameNumber !== FRAMES_PER_GAME) {
    return rolls[0] === PINS || rolls.length >= 2;
  }

  if (rolls.length < 2) return false;
  const earnedBonusRoll = rolls[0] === PINS || rolls[0] + rolls[1] === PINS;
  return earnedBonusRoll ? rolls.length >= 3 : true;
}

/**
 * Scans a frame's raw box characters (0-9, "X", "/") left to right, tracking
 * pins standing in the current rack (resets to 10 after a strike or spare).
 * This single rule reproduces the 10th frame's bonus-roll rules without
 * special-casing them, since a bonus roll is just another fresh (or partial)
 * rack by the same logic.
 */
export function parseFrameInput(frameNumber: number, boxes: string[]): FrameInputParseResult {
  const rolls: number[] = [];
  let pinsRemaining = PINS;

  for (const box of boxes) {
    if (box === "") break;

    if (!FRAME_BOX_CHAR_PATTERN.test(box)) {
      return {
        status: "invalid",
        rolls,
        expectedBoxCount: frameBoxCount(frameNumber, rolls),
        error: 'Only 0-9, "X", and "/" are allowed.',
      };
    }

    if (box === "X") {
      if (pinsRemaining !== PINS) {
        return {
          status: "invalid",
          rolls,
          expectedBoxCount: frameBoxCount(frameNumber, rolls),
          error: '"X" isn\'t allowed unless all pins are standing.',
        };
      }
      rolls.push(PINS);
      pinsRemaining = PINS;
    } else if (box === "/") {
      if (pinsRemaining === PINS) {
        return {
          status: "invalid",
          rolls,
          expectedBoxCount: frameBoxCount(frameNumber, rolls),
          error: '"/" can\'t be the first roll of a frame.',
        };
      }
      rolls.push(pinsRemaining);
      pinsRemaining = PINS;
    } else {
      const digit = Number(box);
      if (digit > pinsRemaining) {
        return {
          status: "invalid",
          rolls,
          expectedBoxCount: frameBoxCount(frameNumber, rolls),
          error: "Can't knock down more pins than are standing.",
        };
      }
      rolls.push(digit);
      pinsRemaining -= digit;
      if (pinsRemaining === 0) pinsRemaining = PINS;
    }
  }

  const expectedBoxCount = frameBoxCount(frameNumber, rolls);

  if (rolls.length === 0) {
    return { status: "empty", rolls, expectedBoxCount };
  }

  if (!isFrameResolved(frameNumber, rolls)) {
    return { status: "incomplete", rolls, expectedBoxCount };
  }

  const validation = validateFrame(frameNumber, rolls);
  if (!validation.valid) {
    return { status: "invalid", rolls, expectedBoxCount, error: validation.error };
  }

  return { status: "complete", rolls, expectedBoxCount };
}

export function parseGameInput(gameBoxChars: string[][]): GameInputParseResult {
  const frames = gameBoxChars.map((boxes, index) => parseFrameInput(index + 1, boxes));
  const isComplete = frames.every((frame) => frame.status === "complete");
  const rolls = frames.map((frame) => (frame.status === "complete" ? frame.rolls : []));
  return { frames, isComplete, rolls };
}
