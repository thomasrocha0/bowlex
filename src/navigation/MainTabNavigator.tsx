import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatsScreen } from "../screens/stats/StatsScreen";
import { GamesListScreen } from "../screens/games/GamesListScreen";
import { FriendsScreen } from "../screens/social/FriendsScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Stats: "stats-chart",
  GamesList: "list",
  Friends: "people",
  Profile: "person-circle",
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="GamesList" component={GamesListScreen} options={{ title: "Games" }} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
