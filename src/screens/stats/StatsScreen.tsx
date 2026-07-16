import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatTile } from "../../components/StatTile";
import { Palette } from "../../components/Palette"
import { createHorizontalScrollStyles } from "../../components/horizontalScrollStyles";

const TILE_GAP = Dimensions.get("window").width * 0.05;
const scrollStyles = createHorizontalScrollStyles(TILE_GAP);

export function StatsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[scrollStyles.scroll, styles.tileScroll]}
        contentContainerStyle={scrollStyles.content}
      >
        <StatTile label="Games Played" value="10" />
        <StatTile label="Average Score" value="150" />
        <StatTile label="High Score" value="300" />
        <StatTile label="Best Performance" value="Excellent" />
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
