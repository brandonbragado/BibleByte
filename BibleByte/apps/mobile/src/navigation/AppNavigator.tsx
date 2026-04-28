import * as Linking from "expo-linking";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { SplashScreen } from "../features/auth/SplashScreen";
import { WelcomeScreen } from "../features/auth/WelcomeScreen";
import { SignInScreen } from "../features/auth/SignInScreen";
import { SignUpScreen } from "../features/auth/SignUpScreen";
import { GoalScreen } from "../features/onboarding/GoalScreen";
import { FaithQuestionsScreen } from "../features/onboarding/FaithQuestionsScreen";
import { ReminderScreen } from "../features/onboarding/ReminderScreen";
import { ChapterScreen } from "../features/bible-reader/ChapterScreen";
import { VerseScreen } from "../features/bible-reader/VerseScreen";
import { SearchScreen } from "../features/bible-reader/SearchScreen";
import { SnippetScreen } from "../features/scripture-snippets/SnippetScreen";
import { MainTabs, type MainTabParamList } from "./MainTabs";

export type RootStackParamList = {
  Splash: undefined;
  AuthWelcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Goal: undefined;
  FaithQuestions: undefined;
  Reminder: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  BibleChapters: { bookId: string; bookName: string };
  BibleVerses: {
    chapterId: string;
    chapterLabel: string;
    /** Optional verse to scroll to and momentarily highlight on mount. */
    scrollToVerseId?: string;
  };
  BibleSearch: undefined;
  Snippet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import type { LinkingOptions } from "@react-navigation/native";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "biblebites://", "biblebyte://"],
  config: {
    screens: {
      Splash: "",
      AuthWelcome: "auth",
      SignIn: "auth/signin",
      SignUp: "auth/signup",
      Goal: "onboarding/goal",
      FaithQuestions: "onboarding/faith",
      Reminder: "onboarding/reminder",
      MainTabs: {
        path: "app",
        screens: {
          Today: "today",
          Bible: "bible",
          Growth: "growth",
          Saved: "saved",
          Profile: "profile"
        }
      },
      BibleChapters: "bible/book/:bookId",
      BibleVerses: "bible/chapter/:chapterId",
      BibleSearch: "bible/search",
      Snippet: "snippet"
    }
  }
};

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        animation: "slide_from_right",
        headerStyle: { backgroundColor: uiTheme.colors.ivory },
        headerTintColor: uiTheme.colors.deepOlive,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: uiTheme.colors.ivory }
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="AuthWelcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign in" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create account" }} />

      <Stack.Screen name="Goal" component={GoalScreen} options={{ title: "Goals", headerBackVisible: false }} />
      <Stack.Screen name="FaithQuestions" component={FaithQuestionsScreen} options={{ title: "Faith focus" }} />
      <Stack.Screen name="Reminder" component={ReminderScreen} options={{ title: "Reminder" }} />

      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

      <Stack.Screen name="BibleChapters" component={ChapterScreen} options={{ title: "Chapters" }} />
      <Stack.Screen name="BibleVerses" component={VerseScreen} options={{ title: "Verses" }} />
      <Stack.Screen name="BibleSearch" component={SearchScreen} options={{ title: "Search", presentation: "modal" }} />

      <Stack.Screen name="Snippet" component={SnippetScreen} options={{ title: "Snippet", presentation: "modal" }} />
    </Stack.Navigator>
  );
}
