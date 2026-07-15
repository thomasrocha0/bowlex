import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SignInScreen } from "../screens/auth/SignInScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { GameDetailScreen } from "../screens/games/GameDetailScreen";
import { FriendProfileScreen } from "../screens/social/FriendProfileScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="GameDetail" component={GameDetailScreen} options={{ title: "Game" }} />
        <Stack.Screen name="FriendProfile" component={FriendProfileScreen} options={{ title: "Friend" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
