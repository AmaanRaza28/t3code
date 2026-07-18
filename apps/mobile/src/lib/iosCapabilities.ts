import Constants from "expo-constants";

export function hasFullIosCapabilities(): boolean {
  return Constants.expoConfig?.extra?.iosCapabilityProfile !== "reduced";
}
