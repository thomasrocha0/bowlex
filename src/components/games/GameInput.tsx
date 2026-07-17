import { useRef } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { parseFrameInput, parseGameInput } from "../../lib/frameNotation";
import { calculateFrameScores } from "../../lib/scoring";
import { FrameInput } from "./FrameInput";
import { gameColors } from "./gameColors";

interface GameInputProps {
  gameNumber: number;
  /** 10 frames, each a fixed length-3 array of raw characters (unused slots are ""). */
  boxChars: string[][];
  onChangeBoxChars: (frameIndex: number, boxes: string[]) => void;
}

/**
 * Owns no submit/validity state itself -- the parent modal calls
 * parseGameInput(boxChars).isComplete directly, so there's one source of
 * truth for "is this game done" rather than two components disagreeing.
 */
export function GameInput({ gameNumber, boxChars, onChangeBoxChars }: GameInputProps) {
  const parsed = parseGameInput(boxChars);
  const frameScores = calculateFrameScores(parsed.rolls);
  const totalScore = frameScores[9];

  // Flat ref table (per frame, per box) so typing a box can move focus into
  // the next frame, not just the next box of the same frame.
  const inputRefs = useRef<Array<Array<TextInput | null>>>([]);

  const focusBox = (frameIndex: number, boxIndex: number) => {
    // iOS silently drops a .focus() call made synchronously within the same
    // tick as the onChangeText that triggered it (still mid-blur of the
    // current input); deferring a tick makes the same call work there too.
    setTimeout(() => {
      inputRefs.current[frameIndex]?.[boxIndex]?.focus();
    }, 0);
  };

  const handleChangeBox = (frameIndex: number, boxIndex: number, char: string) => {
    const currentBoxes = boxChars[frameIndex];
    const updated = currentBoxes.map((box, i) => {
      if (i < boxIndex) return box;
      if (i === boxIndex) return char;
      return ""; // editing an earlier roll invalidates whatever came after it
    });
    onChangeBoxChars(frameIndex, updated);

    if (char === "") return; // deleting shouldn't move focus

    const { status, expectedBoxCount } = parseFrameInput(frameIndex + 1, updated);
    if (status !== "complete" && boxIndex + 1 < expectedBoxCount) {
      focusBox(frameIndex, boxIndex + 1);
    } else if (frameIndex + 1 < boxChars.length) {
      focusBox(frameIndex + 1, 0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameLabel}>Game {gameNumber}</Text>
        <Text style={styles.totalScore}>{totalScore ?? "--"}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.framesRow}>
          {parsed.frames.map((frame, index) => (
            <FrameInput
              key={index}
              frameNumber={index + 1}
              scale={0.8}
              boxes={boxChars[index]}
              expectedBoxCount={frame.expectedBoxCount}
              filledBoxCount={frame.rolls.length}
              status={frame.status}
              error={frame.error}
              frameScore={frameScores[index]}
              onChangeBox={(boxIndex, char) => handleChangeBox(index, boxIndex, char)}
              registerBoxRef={(boxIndex, el) => {
                inputRefs.current[index] ??= [];
                inputRefs.current[index][boxIndex] = el;
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameColors.background,
    borderColor: gameColors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gameLabel: { fontSize: 15, fontWeight: "600", color: gameColors.label },
  totalScore: { fontSize: 18, fontWeight: "700", color: gameColors.totalScore },
  framesRow: { flexDirection: "row", gap: 6 },
});
