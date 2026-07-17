import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { frameColors } from "./frameColors";

interface FrameDisplayProps {
  frameNumber: number;
  rolls: number[];
  scale: number;
  frameScore?: number | null;
}

const PINS = 10;
const FRAMES_PER_GAME = 10;

/**
 * Inverse of the scan in frameNotation.ts's parseFrameInput -- turns
 * already-validated numeric rolls back into notation characters for
 * read-only display.
 * */
function formatRolls(frameNumber: number, rolls: number[]): string[] {
  const targetLength = frameNumber === FRAMES_PER_GAME ? 3 : 2;
  const chars: string[] = [];
  let pinsRemaining = PINS;

  for (const roll of rolls) {
    if (roll === PINS && pinsRemaining === PINS) {
      chars.push("X");
      pinsRemaining = PINS;
    } else if (pinsRemaining !== PINS && roll === pinsRemaining) {
      chars.push("/");
      pinsRemaining = PINS;
    } else {
      chars.push(roll === 0 ? "-" : String(roll));
      pinsRemaining -= roll;
      if (pinsRemaining === 0) pinsRemaining = PINS;
    }
  }

  while (chars.length < targetLength) chars.push("-");

  return chars;
}

export function FrameDisplay({ frameNumber, rolls, scale, frameScore }: FrameDisplayProps) {
  const chars = formatRolls(frameNumber, rolls);
  return (
    <View style={styles.container}>
      <Text style={styles.frameNumber}>{frameNumber}</Text>
      <View style={styles.boxesRow}>
        {chars.flatMap((char, index) => {
          const box = (
            <View
              key={`box-${index}`}
              style={[styles.box, { width: styles.box.width * scale, height: styles.box.height * scale }]}
            >
              <Text style={[styles.boxText, { fontSize: styles.box.fontSize * scale }]}>{char}</Text>
            </View>
          );

          if (index === 0) return [box];

          const delimiter = (
            <View key={`delimiter-${index}`} style={[styles.delimiter, { height: styles.box.height * scale }]} />
          );

          return [delimiter, box];
        })}
      </View>
      <Text style={[styles.score, { fontSize: styles.box.fontSize * scale }]} numberOfLines={1}>
        {frameScore ?? ""}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    alignItems: "center", 
    gap: 0,
    backgroundColor: frameColors.background,
    borderColor: frameColors.border,
    borderWidth: 1,
    padding: 2,
    borderRadius: 4,
  },
  frameNumber: { fontSize: 9, color: frameColors.text },
  boxesRow: { 
    flexDirection: "row", 
    gap: 3, 
    paddingHorizontal: 2,
    borderTopColor: frameColors.delimiterColor,
    borderTopWidth: 1,
    borderBottomColor: frameColors.delimiterColor,
    borderBottomWidth: 1,
  },
  box: {
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: frameColors.background,
    width: 10,
    height: 20,
    fontSize: 12,
  },
  delimiter: {
    width: 1,
    backgroundColor: frameColors.delimiterColor,
  },
  boxText: { color: frameColors.text, fontWeight: "500" },
  score: { color: frameColors.score, fontWeight: "600", minHeight: 13 },
});
