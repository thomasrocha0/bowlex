const PINS = 10;
const FRAMES_PER_GAME = 10;

export function isStrike(rolls: number[], index: number): boolean {
  return rolls[index] === PINS;
}

export function isSpare(rolls: number[], index: number): boolean {
  return !isStrike(rolls, index) && rolls[index] + rolls[index + 1] === PINS;
}

/**
 * Scores a complete game from its per-frame rolls (frames[0..8] hold 1 roll
 * for a strike or 2 otherwise; frames[9] — the 10th — holds 2 or 3 bonus rolls).
 * Flattening preserves frame order, so the classic lookahead algorithm can walk
 * it as one roll sequence without re-deriving frame boundaries.
 */
export function calculateGameScore(frames: number[][]): number {
  const rolls = frames.flat();
  let score = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < FRAMES_PER_GAME; frame++) {
    if (isStrike(rolls, rollIndex)) {
      score += PINS + rolls[rollIndex + 1] + rolls[rollIndex + 2];
      rollIndex += 1;
    } else if (isSpare(rolls, rollIndex)) {
      score += PINS + rolls[rollIndex + 2];
      rollIndex += 2;
    } else {
      score += rolls[rollIndex] + rolls[rollIndex + 1];
      rollIndex += 2;
    }
  }

  return score;
}

export interface FrameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a single frame's rolls in isolation (pin counts in range, frame
 * total not exceeding 10 pins standing). Client-side gate before a frame is
 * written, per the "validate before writing" rule in CLAUDE.md.
 */
export function validateFrame(frameNumber: number, rolls: number[]): FrameValidationResult {
  if (rolls.some((r) => !Number.isInteger(r) || r < 0 || r > PINS)) {
    return { valid: false, error: "Each roll must knock down between 0 and 10 pins." };
  }

  const isTenthFrame = frameNumber === FRAMES_PER_GAME;

  if (!isTenthFrame) {
    if (rolls.length < 1 || rolls.length > 2) {
      return { valid: false, error: "Frames 1-9 have one roll (strike) or two rolls." };
    }
    if (rolls.length === 2 && rolls[0] + rolls[1] > PINS) {
      return { valid: false, error: "Rolls in a frame can't knock down more than 10 pins total." };
    }
    if (rolls.length === 1 && rolls[0] !== PINS) {
      return { valid: false, error: "A single roll in a non-10th frame must be a strike." };
    }
    return { valid: true };
  }

  if (rolls.length < 2 || rolls.length > 3) {
    return { valid: false, error: "The 10th frame has two rolls, or three if it includes a strike/spare." };
  }
  if (rolls[0] !== PINS && rolls[0] + rolls[1] > PINS) {
    return { valid: false, error: "The first two rolls of the 10th frame can't exceed 10 pins unless the first is a strike." };
  }
  const earnedBonusRoll = rolls[0] === PINS || rolls[0] + rolls[1] === PINS;
  if (rolls.length === 3 && !earnedBonusRoll) {
    return { valid: false, error: "A third roll in the 10th frame requires a strike or spare in the first two rolls." };
  }
  if (rolls.length === 2 && earnedBonusRoll) {
    return { valid: false, error: "A strike or spare in the 10th frame earns a bonus roll." };
  }
  if (rolls.length === 3 && rolls[0] === PINS && rolls[1] !== PINS && rolls[1] + rolls[2] > PINS) {
    return { valid: false, error: "Bonus rolls after a 10th-frame strike can't exceed 10 pins unless the first bonus roll is itself a strike." };
  }

  return { valid: true };
}
