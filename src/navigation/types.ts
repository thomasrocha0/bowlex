export type MainTabParamList = {
  Stats: undefined;
  GamesList: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  GameDetail: { gameId: string };
  FriendProfile: { profileId: string };
};
