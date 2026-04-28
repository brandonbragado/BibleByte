import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

export const authRedirectPath = "auth/callback";
export const passwordResetRedirectPath = "auth/reset";

export function buildAuthRedirectUri(path: string) {
  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo) {
    return AuthSession.makeRedirectUri({
      path
    });
  }
  return AuthSession.makeRedirectUri({
    scheme: "biblebites",
    path
  });
}
