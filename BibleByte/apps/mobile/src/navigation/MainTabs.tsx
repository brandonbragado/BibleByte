import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { uiTheme } from "@biblebites/ui";
import { TodayScreen } from "../features/today/TodayScreen";
import { BibleBooksScreen } from "../features/bible-reader/BibleBooksScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { BookmarksScreen } from "../features/bookmarks/BookmarksScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";

export type MainTabParamList = {
  Today: undefined;
  Bible: undefined;
  Growth: undefined;
  Saved: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconKey = "today" | "bible" | "growth" | "saved" | "profile";

const tabIcon: Record<TabIconKey, keyof typeof Feather.glyphMap> = {
  today: "sun",
  bible: "book-open",
  growth: "trending-up",
  saved: "bookmark",
  profile: "user"
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: uiTheme.colors.deepOlive,
        tabBarInactiveTintColor: uiTheme.colors.sage,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.4
        },
        tabBarStyle: {
          backgroundColor: uiTheme.colors.parchment,
          borderTopColor: uiTheme.colors.divider,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6
        }
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Feather name={tabIcon.today} size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Bible"
        component={BibleBooksScreen}
        options={{
          title: "Bible",
          tabBarIcon: ({ color, size }) => <Feather name={tabIcon.bible} size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Growth"
        component={ProgressScreen}
        options={{
          title: "Growth",
          tabBarIcon: ({ color, size }) => <Feather name={tabIcon.growth} size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Saved"
        component={BookmarksScreen}
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Feather name={tabIcon.saved} size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Feather name={tabIcon.profile} size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
