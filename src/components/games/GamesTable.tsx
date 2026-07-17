import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { calculateGameScore } from "../../lib/scoring";
import { sortedRolls } from "../../lib/stats";
import { sortGames, type GamesSortOption } from "../../lib/gamesSort";
import type { GameWithFrames } from "../../types";
import { GameDisplay } from "./GameDisplay";
import { gamesTableColors } from "./gamesTableColors";

const SORT_OPTIONS: { value: GamesSortOption; label: string }[] = [
  { value: "mostRecent", label: "Most Recent" },
  { value: "leastRecent", label: "Least Recent" },
  { value: "highScore", label: "High Score" },
  { value: "lowScore", label: "Low Score" },
];

interface GamesTableProps {
  games: GameWithFrames[];
  sort: GamesSortOption;
  onSortChange: (sort: GamesSortOption) => void;
}

export function GamesTable({ games, sort, onSortChange }: GamesTableProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortedGames = sortGames(games, sort);
  const selectedOption = SORT_OPTIONS.find((option) => option.value === sort);

  const handleSelect = (value: GamesSortOption) => {
    onSortChange(value);
    setIsSortOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortTrigger} onPress={() => setIsSortOpen((open) => !open)}>
          <Text style={styles.sortTriggerLabel}>{selectedOption?.label}</Text>
          <Text style={styles.sortTriggerChevron}>{isSortOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>
      </View>

      {isSortOpen && (
        <>
          <Pressable style={styles.sortBackdrop} onPress={() => setIsSortOpen(false)} />
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity key={option.value} style={styles.sortMenuItem} onPress={() => handleSelect(option.value)}>
                <Text style={[styles.sortMenuItemLabel, sort === option.value && styles.sortMenuItemLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {sortedGames.length === 0 && <Text style={styles.empty}>No games yet — tap "Add Games" to log your first one.</Text>}
        {sortedGames.map((game) => {
          const frames = sortedRolls(game);
          const score = frames.length === 10 ? calculateGameScore(frames) : null;
          const bowledAt = game.series?.bowled_at ?? game.created_at;
          return (
            <ScrollView key={game.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              <View style={styles.rowMeta}>
                <Text style={styles.score}>{score ?? "--"}</Text>
                <Text style={styles.date}>{new Date(bowledAt).toLocaleDateString()}</Text>
              </View>
              <GameDisplay frames={frames} scale={1} />
            </ScrollView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    gap: 8,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  sortTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: gamesTableColors.backgroundInactive,
  },
  sortTriggerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: gamesTableColors.fontInactive,
  },
  sortTriggerChevron: {
    fontSize: 10,
    color: gamesTableColors.fontInactive,
  },
  sortBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  sortMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    zIndex: 20,
    minWidth: 150,
    borderRadius: 8,
    backgroundColor: gamesTableColors.menuBackground,
    borderWidth: 1,
    borderColor: gamesTableColors.rowBorder,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sortMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sortMenuItemLabel: {
    fontSize: 13,
    color: gamesTableColors.fontInactive,
  },
  sortMenuItemLabelActive: {
    color: gamesTableColors.backgroundActive,
    fontWeight: "700",
  },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 0.1,
    borderBottomColor: gamesTableColors.rowBorder,
    paddingBottom: 12,
  },
  rowMeta: { width: 45, alignItems: "center", gap: 2 },
  score: { fontSize: 18, fontWeight: "700", color: gamesTableColors.score },
  date: { fontSize: 9, color: gamesTableColors.date },
  empty: { color: gamesTableColors.empty, textAlign: "center", marginTop: 24 },
});
