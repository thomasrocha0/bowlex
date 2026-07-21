import { useEffect } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { StatTile } from "../../components/StatTile";
import { ScoreHistoryChart } from "../../components/stats/ScoreHistoryChart";
import { Palette } from "../../components/Palette"
import { createHorizontalScrollStyles } from "../../components/horizontalScrollStyles";
import { useSession } from "../../hooks/auth/useSession";
import { useGames } from "../../hooks/games/useGames";
import { useGamesStore } from "../../store/useGamesStore";
import { calculateStats } from "../../lib/stats";

const TILE_GAP = Dimensions.get("window").width * 0.05;
const scrollStyles = createHorizontalScrollStyles(TILE_GAP);

export function StatsScreen() {
  const { session } = useSession();
  const profileId = session?.user.id ?? "";
  const { data: fetchedGames } = useGames(profileId);

  const games = useGamesStore((state) => state.games);
  const setGames = useGamesStore((state) => state.setGames);

  useEffect(() => {
    if (fetchedGames) setGames(fetchedGames);
  }, [fetchedGames, setGames]);

  const stats = calculateStats(games);

  return (
    <View style={styles.container}>
      <View style={styles.tileContainer}>
        <StatTile label="Average Score" value={stats.averageScore.toFixed(1)} />
        <StatTile label="High Score" value={String(stats.highGame)} />
        <StatTile label="Average Pins" value={stats.averagePins.toFixed(1)} />
        <StatTile label="Strike Rate" value={`${stats.strikePercentage.toFixed(1)}%`} />
        <StatTile label="Spare Rate" value={`${stats.sparePercentage.toFixed(1)}%`} />
        <StatTile label="Open Frame Rate" value={`${stats.openFramePercentage.toFixed(1)}%`} />
      </View>

      <View style={styles.chartContainer}>
        <ScoreHistoryChart games={games} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: "column",
    justifyContent: "flex-start", 
    backgroundColor: Palette["grey-50"],
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 20
  },
  tileContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  chartContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  title: { fontSize: 20, fontWeight: "600" },
  tileScroll: {
    marginTop: 20,
  },
});
