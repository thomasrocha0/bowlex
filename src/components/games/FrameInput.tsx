import { StyleSheet, Text, TextInput, View } from "react-native";
import { FRAME_BOX_CHAR_PATTERN, type FrameInputStatus } from "../../lib/frameNotation";
import { frameColors } from "./frameColors";


interface FrameInputProps {
  frameNumber: number;
  scale: number;
  /** Raw characters typed so far, padded to at least `expectedBoxCount`. */
  boxes: string[];
  expectedBoxCount: number;
  /** `rolls.length` from the matching parseFrameInput result. */
  filledBoxCount: number;
  status: FrameInputStatus;
  error?: string;
  frameScore?: number | null;
  onChangeBox: (boxIndex: number, char: string) => void;
  /** Fired on a Backspace keypress (web/iOS only -- see GameInput), even when the box is already empty. */
  onBackspace: (boxIndex: number) => void;
  /** Lets the parent (GameInput) manage a cross-frame ref table so typing can advance focus into the next frame. */
  registerBoxRef: (boxIndex: number, el: TextInput | null) => void;
  disabled?: boolean;
}


/**
 * Presentational only -- the parent (GameInput) runs parseFrameInput once
 * for the whole game and passes the result down, so parsing doesn't happen
 * once per frame per render. Focus-advancing also lives in GameInput since
 * it alone knows about neighboring frames' boxes.
 */
export function FrameInput({
  frameNumber,
  scale,
  boxes,
  expectedBoxCount,
  filledBoxCount,
  status,
  error,
  frameScore,
  onChangeBox,
  onBackspace,
  registerBoxRef,
  disabled,
}: FrameInputProps) {
  const sizeStyle = {
    boxSize: 30 * scale,
    fontSize: 15 * scale,
    scoreFontSize: 12 * scale
  };
  const borderColor = status === "invalid" ? frameColors.invalidBorder : frameColors.border;

  // A resolved frame (e.g. a strike in frames 1-9) leaves trailing boxes
  // permanently inert; otherwise only the next box to fill is editable.
  const isBoxDisabled = (index: number) => {
    if (disabled) return true;
    if (status === "complete") return index >= filledBoxCount;
    return index > filledBoxCount;
  };

  const handleChangeText = (index: number, text: string) => {
    if (text === "") {
      onChangeBox(index, "");
      return;
    }
    const upper = text.toUpperCase();
    if (!FRAME_BOX_CHAR_PATTERN.test(upper)) return;
    onChangeBox(index, upper);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.frameNumber}>{frameNumber}</Text>
      <View style={styles.boxesRow}>
        {Array.from({ length: expectedBoxCount }, (_, index) => (
          <TextInput
            key={index}
            ref={(el) => registerBoxRef(index, el)}
            style={[
              styles.box,
              {
                width: sizeStyle.boxSize,
                height: sizeStyle.boxSize,
                fontSize: sizeStyle.fontSize,
                borderColor,
                backgroundColor: isBoxDisabled(index) ? frameColors.disabledBorder : frameColors.background,
              },
            ]}
            value={boxes[index] ?? ""}
            onChangeText={(text) => handleChangeText(index, text)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace") onBackspace(index);
            }}
            editable={!isBoxDisabled(index)}
            selectTextOnFocus
            maxLength={1}
            autoCapitalize="characters"
            keyboardType="numbers-and-punctuation"
          />
        ))}
      </View>
      <Text style={[styles.score, { fontSize: sizeStyle.scoreFontSize }]} numberOfLines={1}>
        {frameScore ?? ""}
      </Text>
      {status === "invalid" && error && (
        <Text style={styles.error} numberOfLines={1}>
        {"Invalid Frame"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 2 },
  frameNumber: { fontSize: 10, color: frameColors.text },
  boxesRow: { 
    flexDirection: "row", 
    gap: 2,
    borderTopColor: frameColors.border,
    borderTopWidth: 1,
    borderBottomColor: frameColors.border,
    borderBottomWidth: 1,
  },
  box: {
    borderWidth: 1,
    borderRadius: 4,
    textAlign: "center",
    padding: 0,
    color: frameColors.text,
  },
  score: { color: frameColors.score, fontWeight: "600", minHeight: 14 },
  error: { color: frameColors.error, fontSize: 9, maxWidth: 70, textAlign: "center" },
});
