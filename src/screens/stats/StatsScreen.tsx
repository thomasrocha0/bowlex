import { useEffect } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { StatTile } from "../../components/StatTile";
import { Palette } from "../../components/Palette"
import { createHorizontalScrollStyles } from "../../components/horizontalScrollStyles";
import { useSession } from "../../hooks/useSession";
import { useGames } from "../../hooks/useGames";
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[scrollStyles.scroll, styles.tileScroll]}
        contentContainerStyle={scrollStyles.content}
      >
        <StatTile label="Average Score" value={stats.averageScore.toFixed(1)} />
        <StatTile label="High Score" value={String(stats.highGame)} />
        <StatTile label="Average Pins" value={stats.averagePins.toFixed(1)} />
        <StatTile label="Strike Rate" value={`${stats.strikePercentage.toFixed(1)}%`} />
        <StatTile label="Spare Rate" value={`${stats.sparePercentage.toFixed(1)}%`} />
        <StatTile label="Open Frame Rate" value={`${stats.openFramePercentage.toFixed(1)}%`} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Palette["grey-50"] },
  title: { fontSize: 20, fontWeight: "600" },
  tileScroll: {
    marginTop: 20,
  },
});
