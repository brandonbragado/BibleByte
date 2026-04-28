import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNavigator, linking } from "./navigation/AppNavigator";
import type { RootStackParamList } from "./navigation/AppNavigator";
import { useAuthSession } from "./hooks/useAuthSession";
import { AuthGate } from "./features/auth/AuthGate";
import { trackEvent } from "./services/analyticsService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000
    }
  }
});

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

export function AppRoot() {
  useAuthSession();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    // TODO[SENTRY_MOBILE]: Initialize Sentry React Native in app entrypoint.
    if (Platform.OS === "web") {
      // Web has no expo-notifications response listener; the deep link is
      // handled by React Navigation's `linking` config + the browser URL bar.
      return;
    }
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const deepLink = response.notification.request.content.data?.deeplink;
      void trackEvent("notification_opened", {
        deeplink: typeof deepLink === "string" ? deepLink : null
      });
      if (typeof deepLink !== "string") {
        return;
      }
      const nav = navigationRef.current;
      if (nav?.isReady()) {
        nav.navigate("MainTabs", { screen: "Today" });
      } else {
        void Linking.openURL(deepLink);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGate>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <AppNavigator />
          </NavigationContainer>
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
