import * as NodeModule from "node:module";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { ExpoConfig } from "expo/config";

const require = NodeModule.createRequire(import.meta.url);
const { removeIosReducedCapabilities } = require("./plugins/withIosReducedCapabilities.cjs") as {
  readonly removeIosReducedCapabilities: (
    entitlements: Record<string, unknown>,
  ) => Record<string, unknown>;
};

const CONFIG_ENV_NAMES = [
  "APP_VARIANT",
  "T3CODE_IOS_BUILD_NUMBER",
  "T3CODE_IOS_BUNDLE_ID",
  "T3CODE_IOS_CAPABILITY_PROFILE",
  "T3CODE_IOS_PERSONAL_TEAM",
  "T3CODE_IOS_PERSONAL_TEAM_BUNDLE_ID",
  "T3CODE_IOS_PERSONAL_TEAM_ID",
  "T3CODE_IOS_TEAM_ID",
  "T3CODE_MOBILE_APP_VERSION",
  "T3CODE_MOBILE_DISTRIBUTION",
] as const;

type ConfigEnvName = (typeof CONFIG_ENV_NAMES)[number];
type ConfigEnv = Partial<Record<ConfigEnvName, string>>;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("mobile Expo config", () => {
  it("keeps the default upstream configuration unchanged", async () => {
    const config = await loadConfig({ APP_VARIANT: "development" });

    expect(config).toMatchObject({
      name: "T3 Code Dev",
      owner: "pingdotgg",
      scheme: "t3code-dev",
      version: "0.1.0",
      updates: {
        enabled: true,
        url: "https://u.expo.dev/d763fcb8-d37c-41ea-a773-b54a0ab4a454",
        checkAutomatically: "ON_LOAD",
        fallbackToCacheTimeout: 0,
      },
      ios: {
        appleTeamId: "ARK85ZXQ4Z",
        bundleIdentifier: "com.t3tools.t3code.dev",
        associatedDomains: ["applinks:clerk.t3.codes", "webcredentials:clerk.t3.codes"],
      },
      extra: {
        appVariant: "development",
        iosCapabilityProfile: "full",
        eas: {
          projectId: "d763fcb8-d37c-41ea-a773-b54a0ab4a454",
        },
      },
    });
    expect(config.ios).not.toHaveProperty("buildNumber");

    const plugins = pluginNames(config);
    expect(plugins).toContain("./plugins/withShareExtensionDisplayName.cjs");
    expect(plugins).toContain("./plugins/withWidgetLogoAsset.cjs");
    expect(plugins).toContain("expo-widgets");
    expect(plugins).not.toContain("./plugins/withIosReducedCapabilities.cjs");
    expect(pluginOptions(config, "expo-sharing")).toMatchObject({ ios: { enabled: true } });
    expect(pluginOptions(config, "@clerk/expo")).toMatchObject({ appleSignIn: true });
  });

  it("builds the independent reduced production configuration", async () => {
    const config = await loadConfig({
      APP_VARIANT: "production",
      T3CODE_IOS_BUILD_NUMBER: "1",
      T3CODE_IOS_BUNDLE_ID: "com.amaan.t3code",
      T3CODE_IOS_CAPABILITY_PROFILE: "reduced",
      T3CODE_IOS_TEAM_ID: "A3D5Y45BUQ",
      T3CODE_MOBILE_APP_VERSION: "0.1.0",
      T3CODE_MOBILE_DISTRIBUTION: "independent",
    });

    expect(config).toMatchObject({
      name: "T3 Code",
      scheme: "t3code",
      version: "0.1.0",
      icon: "../../assets/prod/black-ios-1024.png",
      updates: { enabled: false },
      ios: {
        appleTeamId: "A3D5Y45BUQ",
        buildNumber: "1",
        bundleIdentifier: "com.amaan.t3code",
        icon: "../../assets/prod/app-icon.icon",
      },
      extra: {
        appVariant: "production",
        iosCapabilityProfile: "reduced",
      },
    });
    expect(config).not.toHaveProperty("owner");
    expect(config.extra).not.toHaveProperty("eas");
    expect(config.ios).not.toHaveProperty("associatedDomains");

    const plugins = pluginNames(config);
    expect(plugins).not.toContain("./plugins/withShareExtensionDisplayName.cjs");
    expect(plugins).not.toContain("./plugins/withWidgetLogoAsset.cjs");
    expect(plugins).not.toContain("expo-widgets");
    expect(plugins.indexOf("./plugins/withIosReducedCapabilities.cjs")).toBeLessThan(
      plugins.indexOf("expo-notifications"),
    );
    expect(plugins.indexOf("./plugins/withIosReducedCapabilities.cjs")).toBeLessThan(
      plugins.indexOf("@clerk/expo"),
    );
    expect(pluginOptions(config, "expo-sharing")).toMatchObject({ ios: { enabled: false } });
    expect(pluginOptions(config, "@clerk/expo")).toMatchObject({ appleSignIn: false });
  });

  it("allows custom signing and versioning with the full capability profile", async () => {
    const config = await loadConfig({
      APP_VARIANT: "preview",
      T3CODE_IOS_BUILD_NUMBER: "42",
      T3CODE_IOS_BUNDLE_ID: "com.example.t3code.preview",
      T3CODE_IOS_CAPABILITY_PROFILE: "full",
      T3CODE_IOS_TEAM_ID: "ABC1234567",
      T3CODE_MOBILE_APP_VERSION: "2.3.4",
    });

    expect(config).toMatchObject({
      name: "T3 Code Preview",
      owner: "pingdotgg",
      scheme: "t3code-preview",
      version: "2.3.4",
      updates: { enabled: true },
      ios: {
        appleTeamId: "ABC1234567",
        buildNumber: "42",
        bundleIdentifier: "com.example.t3code.preview",
        associatedDomains: ["applinks:clerk.t3.codes", "webcredentials:clerk.t3.codes"],
      },
      extra: {
        iosCapabilityProfile: "full",
        eas: {
          projectId: "d763fcb8-d37c-41ea-a773-b54a0ab4a454",
        },
      },
    });

    const plugins = pluginNames(config);
    expect(plugins).toContain("./plugins/withShareExtensionDisplayName.cjs");
    expect(plugins).toContain("expo-widgets");
    expect(plugins).not.toContain("./plugins/withIosReducedCapabilities.cjs");
    expect(pluginOptions(config, "expo-sharing")).toMatchObject({
      ios: {
        enabled: true,
        extensionBundleIdentifier: "com.example.t3code.preview.sharing",
        appGroupId: "group.com.example.t3code.preview",
      },
    });
    expect(pluginOptions(config, "expo-widgets")).toMatchObject({
      bundleIdentifier: "com.example.t3code.preview.widgets",
      groupIdentifier: "group.com.example.t3code.preview",
    });
  });

  it.each([
    [
      { T3CODE_MOBILE_DISTRIBUTION: "private" },
      'T3CODE_MOBILE_DISTRIBUTION must be either "upstream" or "independent"',
    ],
    [
      { T3CODE_IOS_CAPABILITY_PROFILE: "personal" },
      'T3CODE_IOS_CAPABILITY_PROFILE must be either "full" or "reduced"',
    ],
    [{ T3CODE_IOS_PERSONAL_TEAM: "1" }, "T3CODE_IOS_PERSONAL_TEAM is no longer supported"],
    [
      { T3CODE_IOS_BUNDLE_ID: "not a bundle" },
      "T3CODE_IOS_BUNDLE_ID must be a reverse-DNS identifier",
    ],
    [{ T3CODE_IOS_TEAM_ID: "not-a-team" }, "T3CODE_IOS_TEAM_ID must be the 10-character"],
    [
      { T3CODE_MOBILE_APP_VERSION: "1.0" },
      "T3CODE_MOBILE_APP_VERSION must contain three dot-separated",
    ],
    [{ T3CODE_IOS_BUILD_NUMBER: "0" }, "T3CODE_IOS_BUILD_NUMBER must be a positive integer"],
    [{ T3CODE_IOS_BUILD_NUMBER: "1.2" }, "T3CODE_IOS_BUILD_NUMBER must be a positive integer"],
  ] satisfies ReadonlyArray<readonly [ConfigEnv, string]>)(
    "rejects invalid configuration %#",
    async (env, message) => {
      await expect(loadConfig(env)).rejects.toThrow(message);
    },
  );
});

describe("withIosReducedCapabilities", () => {
  it("removes restricted capabilities while preserving unrelated entitlements", () => {
    const entitlements = {
      "aps-environment": "development",
      "com.apple.developer.applesignin": ["Default"],
      "com.apple.developer.associated-domains": ["applinks:clerk.t3.codes"],
      "com.apple.security.application-groups": ["group.com.t3tools.t3code.dev"],
      "com.apple.developer.team-identifier": "A3D5Y45BUQ",
    };

    expect(removeIosReducedCapabilities(entitlements)).toEqual({
      "com.apple.developer.team-identifier": "A3D5Y45BUQ",
    });
  });
});

async function loadConfig(env: ConfigEnv = {}): Promise<ExpoConfig> {
  for (const name of CONFIG_ENV_NAMES) {
    vi.stubEnv(name, env[name] ?? "");
  }
  vi.resetModules();

  return (await import("./app.config.ts")).default;
}

function pluginNames(config: ExpoConfig): readonly string[] {
  return (config.plugins ?? []).flatMap((plugin) => {
    const name = typeof plugin === "string" ? plugin : plugin[0];
    return name ? [name] : [];
  });
}

function pluginOptions(
  config: ExpoConfig,
  pluginName: string,
): Record<string, unknown> | undefined {
  const plugin = (config.plugins ?? []).find(
    (candidate) => Array.isArray(candidate) && candidate[0] === pluginName,
  );
  if (!Array.isArray(plugin)) {
    return undefined;
  }
  return plugin[1] as Record<string, unknown> | undefined;
}
