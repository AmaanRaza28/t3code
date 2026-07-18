import type { ExpoConfig } from "expo/config";

import { BRAND_ASSET_PATHS } from "../../scripts/lib/brand-assets.ts";
import { loadRepoEnv } from "../../scripts/lib/public-config.ts";

type AppDistribution = "independent" | "upstream";
type AppVariant = "development" | "preview" | "production";
type IosCapabilityProfile = "full" | "reduced";

const repoEnv = loadRepoEnv();
Object.assign(process.env, repoEnv);

const legacyPersonalTeamEnvName = [
  "T3CODE_IOS_PERSONAL_TEAM",
  "T3CODE_IOS_PERSONAL_TEAM_BUNDLE_ID",
  "T3CODE_IOS_PERSONAL_TEAM_ID",
].find((name) => repoEnv[name]?.trim());

if (legacyPersonalTeamEnvName) {
  throw new Error(
    `${legacyPersonalTeamEnvName} is no longer supported. Configure T3CODE_IOS_TEAM_ID, T3CODE_IOS_BUNDLE_ID, and T3CODE_IOS_CAPABILITY_PROFILE separately.`,
  );
}

const APP_DISTRIBUTION = resolveAppDistribution(repoEnv.T3CODE_MOBILE_DISTRIBUTION);
const APP_VARIANT = resolveAppVariant(repoEnv.APP_VARIANT);
const IOS_CAPABILITY_PROFILE = resolveIosCapabilityProfile(repoEnv.T3CODE_IOS_CAPABILITY_PROFILE);
const isIndependentDistribution = APP_DISTRIBUTION === "independent";
const hasReducedIosCapabilities = IOS_CAPABILITY_PROFILE === "reduced";

const configuredAppVersion = repoEnv.T3CODE_MOBILE_APP_VERSION?.trim() || "0.1.0";
const configuredIosBuildNumber = repoEnv.T3CODE_IOS_BUILD_NUMBER?.trim() || undefined;
const configuredIosBundleIdentifier = repoEnv.T3CODE_IOS_BUNDLE_ID?.trim() || undefined;
const configuredIosTeamId = repoEnv.T3CODE_IOS_TEAM_ID?.trim() || undefined;
const IOS_BUNDLE_IDENTIFIER_PATTERN = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const IOS_BUILD_NUMBER_PATTERN = /^[1-9]\d*$/;
const IOS_TEAM_ID_PATTERN = /^[A-Z0-9]{10}$/;
const MOBILE_APP_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const fromRepoRoot = (relativePath: string) => `../../${relativePath}`;

if (
  configuredIosBundleIdentifier &&
  !IOS_BUNDLE_IDENTIFIER_PATTERN.test(configuredIosBundleIdentifier)
) {
  throw new Error(
    "T3CODE_IOS_BUNDLE_ID must be a reverse-DNS identifier such as com.example.t3code.",
  );
}

if (configuredIosTeamId && !IOS_TEAM_ID_PATTERN.test(configuredIosTeamId)) {
  throw new Error(
    "T3CODE_IOS_TEAM_ID must be the 10-character uppercase alphanumeric Team ID shown in Xcode.",
  );
}

if (!MOBILE_APP_VERSION_PATTERN.test(configuredAppVersion)) {
  throw new Error(
    "T3CODE_MOBILE_APP_VERSION must contain three dot-separated non-negative integers such as 0.1.0.",
  );
}

if (configuredIosBuildNumber && !IOS_BUILD_NUMBER_PATTERN.test(configuredIosBuildNumber)) {
  throw new Error("T3CODE_IOS_BUILD_NUMBER must be a positive integer such as 1.");
}

const DEVELOPMENT_ASSETS = {
  appIcon: fromRepoRoot(BRAND_ASSET_PATHS.developmentIosIconPng),
  iosIcon: fromRepoRoot(BRAND_ASSET_PATHS.developmentIconComposerProject),
  splashIcon: fromRepoRoot(BRAND_ASSET_PATHS.developmentIosIconPng),
  androidAdaptiveForeground: fromRepoRoot(BRAND_ASSET_PATHS.developmentUniversalIconPng),
  androidAdaptiveBackgroundColor: "#00639B",
  androidMonochromeIcon: "./assets/android-icon-mark.png",
  androidNotificationIcon: "./assets/android-notification-icon.png",
  androidNotificationColor: "#00639B",
} as const;

const PREVIEW_ASSETS = {
  appIcon: fromRepoRoot(BRAND_ASSET_PATHS.nightlyIosIconPng),
  iosIcon: fromRepoRoot(BRAND_ASSET_PATHS.nightlyIconComposerProject),
  splashIcon: fromRepoRoot(BRAND_ASSET_PATHS.nightlyIosIconPng),
  androidAdaptiveForeground: fromRepoRoot(BRAND_ASSET_PATHS.nightlyLinuxIconPng),
  androidAdaptiveBackgroundColor: "#111533",
  androidMonochromeIcon: "./assets/android-icon-mark.png",
  androidNotificationIcon: "./assets/android-notification-icon.png",
  androidNotificationColor: "#7565C7",
} as const;

const RELEASE_ASSETS = {
  appIcon: fromRepoRoot(BRAND_ASSET_PATHS.productionIosIconPng),
  iosIcon: fromRepoRoot(BRAND_ASSET_PATHS.productionIconComposerProject),
  splashIcon: fromRepoRoot(BRAND_ASSET_PATHS.productionIosIconPng),
  androidAdaptiveForeground: "./assets/android-icon-mark.png",
  androidAdaptiveBackgroundColor: "#000000",
  androidMonochromeIcon: "./assets/android-icon-mark.png",
  androidNotificationIcon: "./assets/android-notification-icon.png",
  androidNotificationColor: "#FFFFFF",
} as const;

const VARIANT_CONFIG = {
  development: {
    appName: "T3 Code Dev",
    scheme: "t3code-dev",
    iosBundleIdentifier: "com.t3tools.t3code.dev",
    androidPackage: "com.t3tools.t3code.dev",
    relyingParty: "clerk.t3.codes",
    assets: DEVELOPMENT_ASSETS,
  },
  preview: {
    appName: "T3 Code Preview",
    scheme: "t3code-preview",
    iosBundleIdentifier: "com.t3tools.t3code.preview",
    androidPackage: "com.t3tools.t3code.preview",
    relyingParty: "clerk.t3.codes",
    assets: PREVIEW_ASSETS,
  },
  production: {
    appName: "T3 Code",
    scheme: "t3code",
    iosBundleIdentifier: "com.t3tools.t3code",
    androidPackage: "com.t3tools.t3code",
    relyingParty: "clerk.t3.codes",
    assets: RELEASE_ASSETS,
  },
} as const;

function resolveAppDistribution(value: string | undefined): AppDistribution {
  switch (value?.trim()) {
    case undefined:
    case "":
    case "upstream":
      return "upstream";
    case "independent":
      return "independent";
    default:
      throw new Error('T3CODE_MOBILE_DISTRIBUTION must be either "upstream" or "independent".');
  }
}

function resolveAppVariant(value: string | undefined): AppVariant {
  switch (value) {
    case "development":
    case "preview":
    case "production":
      return value;
    default:
      return "production";
  }
}

function resolveIosCapabilityProfile(value: string | undefined): IosCapabilityProfile {
  switch (value?.trim()) {
    case undefined:
    case "":
    case "full":
      return "full";
    case "reduced":
      return "reduced";
    default:
      throw new Error('T3CODE_IOS_CAPABILITY_PROFILE must be either "full" or "reduced".');
  }
}

const variant = VARIANT_CONFIG[APP_VARIANT];
const iosBundleIdentifier = configuredIosBundleIdentifier ?? variant.iosBundleIdentifier;
const iosTeamId = configuredIosTeamId ?? (isIndependentDistribution ? undefined : "ARK85ZXQ4Z");

const dmSansFonts = {
  regular: "@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf",
  medium: "@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf",
  bold: "@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf",
} as const;

const widgetsPlugin: NonNullable<ExpoConfig["plugins"]>[number] = [
  "expo-widgets",
  {
    bundleIdentifier: `${iosBundleIdentifier}.widgets`,
    groupIdentifier: `group.${iosBundleIdentifier}`,
    enablePushNotifications: true,
    // Agent activity can update many times an hour; without the
    // frequent-updates entitlement iOS throttles the update budget sooner.
    frequentUpdates: true,
    widgets: [
      {
        name: "AgentActivity",
        displayName: "Agent Activity",
        description: "Shows the current state of active T3 Code agents.",
        supportedFamilies: ["systemSmall", "systemMedium", "accessoryRectangular"],
      },
    ],
  },
];

const sharingPlugin: NonNullable<ExpoConfig["plugins"]>[number] = [
  "expo-sharing",
  {
    ios: {
      // Reduced profiles omit App Groups and extension targets. Keep those
      // builds usable while full-capability builds expose the system share target.
      enabled: !hasReducedIosCapabilities,
      extensionBundleIdentifier: `${iosBundleIdentifier}.sharing`,
      appGroupId: `group.${iosBundleIdentifier}`,
      activationRule: {
        supportsText: true,
        supportsWebUrlWithMaxCount: 1,
        supportsImageWithMaxCount: 8,
      },
    },
    android: {
      enabled: true,
      singleShareMimeTypes: ["text/plain", "image/*"],
      multipleShareMimeTypes: ["image/*"],
    },
  },
];

// These aliases match the fonts' PostScript names on iOS. Register the same
// names on Android so React Native and the native composer use one set of
// family names without waiting for runtime font loading.

const config: ExpoConfig = {
  name: variant.appName,
  slug: "t3-code",
  platforms: ["ios", "android"],
  scheme: variant.scheme,
  version: configuredAppVersion,
  runtimeVersion: {
    // Fingerprint (not appVersion) so an OTA only reaches binaries whose native
    // project — native deps, config plugins, AND patches/ — matches the update.
    // With appVersion, every build of one app version shares a runtime version,
    // so a JS update could land on a binary missing the native changes it needs.
    policy: process.env.MOBILE_VERSION_POLICY ?? "fingerprint",
  },
  orientation: "portrait",
  icon: variant.assets.appIcon,
  userInterfaceStyle: "automatic",
  updates: isIndependentDistribution
    ? { enabled: false }
    : {
        enabled: true,
        url: "https://u.expo.dev/d763fcb8-d37c-41ea-a773-b54a0ab4a454",
        checkAutomatically: "ON_LOAD",
        fallbackToCacheTimeout: 0,
      },
  ios: {
    icon: variant.assets.iosIcon,
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
    ...(iosTeamId ? { appleTeamId: iosTeamId } : {}),
    ...(configuredIosBuildNumber ? { buildNumber: configuredIosBuildNumber } : {}),
    ...(!hasReducedIosCapabilities
      ? {
          associatedDomains: [
            `applinks:${variant.relyingParty}`,
            `webcredentials:${variant.relyingParty}`,
          ],
        }
      : {}),
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      NSLocalNetworkUsageDescription:
        "Allow T3 Code to connect to T3 Code servers on your local network or tailnet.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    icon: variant.assets.appIcon,
    package: variant.androidPackage,
    adaptiveIcon: {
      backgroundColor: variant.assets.androidAdaptiveBackgroundColor,
      foregroundImage: variant.assets.androidAdaptiveForeground,
      monochromeImage: variant.assets.androidMonochromeIcon,
    },
    // Opts into OnBackInvokedCallback-based back dispatch (Android 13+).
    // JS back handling survives it via react-native's Android 16 shim plus
    // withAndroidPredictiveBackCompat on Android 13-15.
    predictiveBackGestureEnabled: true,
  },
  web: {
    favicon: variant.assets.appIcon,
  },
  plugins: [
    "expo-asset",
    [
      "expo-font",
      {
        ios: {
          fonts: [dmSansFonts.regular, dmSansFonts.medium, dmSansFonts.bold],
        },
        android: {
          fonts: [
            {
              fontFamily: "DMSans-Regular",
              fontDefinitions: [{ path: dmSansFonts.regular, weight: 400 }],
            },
            {
              fontFamily: "DMSans-Medium",
              fontDefinitions: [{ path: dmSansFonts.medium, weight: 500 }],
            },
            {
              fontFamily: "DMSans-Bold",
              fontDefinitions: [{ path: dmSansFonts.bold, weight: 700 }],
            },
          ],
        },
      },
    ],
    "expo-secure-store",
    "expo-sqlite",
    ...(hasReducedIosCapabilities
      ? [sharingPlugin]
      : ["./plugins/withShareExtensionDisplayName.cjs", sharingPlugin]),
    // Same-type Expo mods run last-registered-first. Register this before all
    // entitlement-producing plugins so its removal runs last.
    ...(hasReducedIosCapabilities ? ["./plugins/withIosReducedCapabilities.cjs"] : []),
    [
      "expo-notifications",
      {
        icon: variant.assets.androidNotificationIcon,
        color: variant.assets.androidNotificationColor,
        mode: APP_VARIANT === "development" ? "development" : "production",
      },
    ],
    // Avoid configuring native Sign in with Apple at all for reduced-capability builds;
    // the entitlement-removal plugin remains a final defense for generated entitlements.
    ["@clerk/expo", { theme: "./clerk-theme.json", appleSignIn: !hasReducedIosCapabilities }],
    "expo-web-browser",
    [
      "expo-quick-actions",
      {
        // Adaptive launcher-shortcut icon; referenced by resource name from
        // the shortcut items set in src/features/shortcuts.
        androidIcons: {
          shortcut_icon: {
            foregroundImage: variant.assets.androidAdaptiveForeground,
            backgroundColor: variant.assets.androidAdaptiveBackgroundColor,
          },
        },
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow T3 Code to access your camera so you can scan pairing QR codes.",
        barcodeScannerEnabled: true,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: variant.assets.splashIcon,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        imageWidth: 220,
        dark: {
          image: variant.assets.splashIcon,
          backgroundColor: "#0a0a0a",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "18.0",
          // AppCheckCore 11.3+ includes Swift and needs module maps for these Objective-C dependencies.
          extraPods: [
            { name: "GoogleUtilities", modular_headers: true },
            { name: "RecaptchaInterop", modular_headers: true },
          ],
        },
      },
    ],
    "./plugins/withIosCocoaPodsUuidCache.cjs",
    // Must be listed BEFORE expo-widgets: same-type mods run last-registered-
    // first, so registering earlier makes this plugin's mods run AFTER
    // expo-widgets' — its dangerous mod wipes ios/ExpoWidgetsTarget/ (which
    // would delete the asset catalog) and its xcodeproj mod creates the widget
    // target (which must exist before the compile phase can be attached).
    ...(!hasReducedIosCapabilities ? ["./plugins/withWidgetLogoAsset.cjs", widgetsPlugin] : []),
    "./plugins/withIosSceneLifecycle.cjs",
    "./plugins/withAndroidCleartextTraffic.cjs",
    "./plugins/withAndroidGradleHeap.cjs",
    "./plugins/withAndroidModernPopupMenu.cjs",
    "./plugins/withAndroidModernAlertDialog.cjs",
    "./plugins/withAndroidPredictiveBackCompat.cjs",
  ],
  extra: {
    appVariant: APP_VARIANT,
    iosCapabilityProfile: IOS_CAPABILITY_PROFILE,
    relay: {
      url: repoEnv.T3CODE_RELAY_URL ?? null,
    },
    clerk: {
      publishableKey: repoEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null,
      jwtTemplate: repoEnv.EXPO_PUBLIC_CLERK_JWT_TEMPLATE ?? null,
    },
    // Native Google sign-in credentials. @clerk/expo reads these from `extra`
    // under their exact env-var names (not nested), and its config plugin reads
    // the iOS URL scheme at prebuild to register it in Info.plist.
    // Unset values must be omitted (not null): the public manifest serializes
    // null to {}, which is truthy and would defeat Clerk's fallback checks.
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: repoEnv.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: repoEnv.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: repoEnv.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: repoEnv.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
    observability: {
      tracesUrl: repoEnv.EXPO_PUBLIC_OTLP_TRACES_URL ?? "https://api.axiom.co/v1/traces",
      tracesDataset: repoEnv.EXPO_PUBLIC_OTLP_TRACES_DATASET ?? null,
      tracesToken: repoEnv.EXPO_PUBLIC_OTLP_TRACES_TOKEN ?? null,
    },
    ...(!isIndependentDistribution
      ? {
          eas: {
            projectId: "d763fcb8-d37c-41ea-a773-b54a0ab4a454",
          },
        }
      : {}),
  },
  ...(!isIndependentDistribution ? { owner: "pingdotgg" } : {}),
};

export default config;
