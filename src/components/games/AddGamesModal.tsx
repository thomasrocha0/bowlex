import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { parseGameInput } from "../../lib/frameNotation";
import { DEFAULT_GAME_COUNT, MAX_GAMES_PER_SERIES } from "../../lib/gamesConfig";
import { useCreateSeriesWithGames } from "../../hooks/games/useCreateSeriesWithGames";
import { addGamesModalColors } from "./addGamesModalColors";
import { GameInput } from "./GameInput";

interface AddGamesModalProps {
  visible: boolean;
  profileId: string;
  onClose: () => void;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function emptyFrameBoxes(): string[] {
  return ["", "", ""];
}

function emptyGameBoxChars(): string[][] {
  return Array.from({ length: 10 }, emptyFrameBoxes);
}

export function AddGamesModal({ visible, profileId, onClose }: AddGamesModalProps) {
  const [gameCount, setGameCount] = useState(DEFAULT_GAME_COUNT);
  const [bowledAtInput, setBowledAtInput] = useState(todayIsoDate);
  const [isDateTouched, setIsDateTouched] = useState(false);
  const [gamesBoxChars, setGamesBoxChars] = useState<string[][][]>(() =>
    Array.from({ length: DEFAULT_GAME_COUNT }, emptyGameBoxChars)
  );
  const createSeries = useCreateSeriesWithGames();

  const isDateValid = isValidDateString(bowledAtInput);
  const dateError = isDateTouched && !isDateValid ? 'Enter a date as "YYYY-MM-DD".' : undefined;

  // Resize the draft to match the chosen game count, preserving already-typed games.
  useEffect(() => {
    setGamesBoxChars((prev) => {
      if (prev.length === gameCount) return prev;
      if (prev.length < gameCount) {
        return [...prev, ...Array.from({ length: gameCount - prev.length }, emptyGameBoxChars)];
      }
      return prev.slice(0, gameCount);
    });
  }, [gameCount]);

  const resetDraft = () => {
    setGameCount(DEFAULT_GAME_COUNT);
    setBowledAtInput(todayIsoDate());
    setIsDateTouched(false);
    setGamesBoxChars(Array.from({ length: DEFAULT_GAME_COUNT }, emptyGameBoxChars));
    createSeries.reset();
  };

  const handleChangeBoxChars = (gameIndex: number, frameIndex: number, boxes: string[]) => {
    setGamesBoxChars((prev) =>
      prev.map((game, gi) =>
        gi !== gameIndex ? game : game.map((frame, fi) => (fi !== frameIndex ? frame : boxes))
      )
    );
  };

  const parsedGames = gamesBoxChars.map((boxChars) => parseGameInput(boxChars));
  const allGamesComplete = parsedGames.length > 0 && parsedGames.every((game) => game.isComplete);
  const canSubmit = allGamesComplete && isDateValid && Boolean(profileId) && !createSeries.isPending;

  const handleSubmit = () => {
    setIsDateTouched(true);
    if (!canSubmit) return;

    createSeries.mutate(
      {
        profileId,
        bowledAt: new Date(bowledAtInput).toISOString(),
        games: parsedGames.map((game) => game.rolls),
      },
      {
        onSuccess: () => {
          resetDraft();
          onClose();
        },
      }
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add Games">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={[styles.dateInput, dateError && styles.dateInputError]}
            value={bowledAtInput}
            onChangeText={setBowledAtInput}
            onBlur={() => setIsDateTouched(true)}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {dateError && <Text style={styles.error}>{dateError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Games in this series</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => setGameCount((c) => Math.max(1, c - 1))} hitSlop={8}>
              <Text style={styles.stepperButton}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperCount}>{gameCount}</Text>
            <TouchableOpacity onPress={() => setGameCount((c) => Math.min(MAX_GAMES_PER_SERIES, c + 1))} hitSlop={8}>
              <Text style={styles.stepperButton}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {gamesBoxChars.map((boxChars, gameIndex) => (
          <GameInput
            key={gameIndex}
            gameNumber={gameIndex + 1}
            boxChars={boxChars}
            onChangeBoxChars={(frameIndex, boxes) => handleChangeBoxChars(gameIndex, frameIndex, boxes)}
          />
        ))}

        {createSeries.isError && <Text style={styles.error}>{createSeries.error.message}</Text>}

        <Button label="Submit" onPress={handleSubmit} disabled={!canSubmit} loading={createSeries.isPending} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: addGamesModalColors.label },
  dateInput: {
    borderWidth: 1,
    borderColor: addGamesModalColors.label,
    borderRadius: 8,
    padding: 10,
  },
  dateInputError: {
    borderColor: addGamesModalColors.error,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperButton: {
    fontSize: 22,
    fontWeight: "700",
    color: addGamesModalColors.stepperButton,
    paddingHorizontal: 8,
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: "600",
    color: addGamesModalColors.stepperCount,
    minWidth: 24,
    textAlign: "center",
  },
  error: { color: addGamesModalColors.error },
});
