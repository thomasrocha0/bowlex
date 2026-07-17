import { StyleSheet, Text, View } from "react-native";
import { calculateFrameScores } from "../../lib/scoring";
import { FrameDisplay } from "./FrameDisplay";
import { gameColors } from "./gameColors";

interface GameDisplayProps {
  /** 10 frames, sorted by frame_number, already-numeric rolls. */
  frames: number[][];
  scale?: number;
}

/**
 * Deliberately doesn't render the total score or a date -- those are
 * separate table-row cells (the games table shows scorecard, score, and
 * date as three independently-sourced pieces of data, not bundled here).
 */
export function GameDisplay({ frames, scale = 1 }: GameDisplayProps) {
  const frameScores = calculateFrameScores(frames);

  return (
    <View style={styles.container}>
      <View style={styles.framesRow}>
        {frames.map((rolls, index) => (
          <FrameDisplay
            key={index}
            frameNumber={index + 1}
            rolls={rolls}
            scale={scale}
            frameScore={frameScores[index]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  gameLabel: { fontSize: 12, fontWeight: "600", color: gameColors.label },
  framesRow: { 
    flexDirection: "row", 
    gap: 4
  },
});
