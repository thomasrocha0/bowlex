import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Palette } from "../../components/Palette";
import { AddGamesModal } from "../../components/games/AddGamesModal";
import { GamesTable } from "../../components/games/GamesTable";
import { useGames } from "../../hooks/useGames";
import { useSession } from "../../hooks/useSession";
import type { GamesSortOption } from "../../lib/gamesSort";
import { useGamesStore } from "../../store/useGamesStore";

export function GamesListScreen() {
  const { session } = useSession();
  const profileId = session?.user.id ?? "";
  const { data: fetchedGames, isLoading } = useGames(profileId);

  const games = useGamesStore((state) => state.games);
  const setGames = useGamesStore((state) => state.setGames);

  useEffect(() => {
    if (fetchedGames) setGames(fetchedGames);
  }, [fetchedGames, setGames]);

  const [modalVisible, setModalVisible] = useState(false);
  const [sort, setSort] = useState<GamesSortOption>("mostRecent");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Games</Text>
        <Button label="Add Games" size="small" onPress={() => setModalVisible(true)} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={Palette["grey-500"]} />
      ) : games.length === 0 ? (
        <Text style={styles.emptyMessage}>No games logged.</Text>
      ) : (
        <GamesTable games={games} sort={sort} onSortChange={setSort} />
      )}

      <AddGamesModal visible={modalVisible} profileId={profileId} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette["grey-50"], padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between"},
  title: { fontSize: 20, fontWeight: "600" },
  loading: { marginTop: 32 },
  emptyMessage: { textAlign: "center", marginTop: 32, color: Palette["grey-500"] },
});
