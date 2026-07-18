# T3 Code Mobile

> [!WARNING]
> T3 Code Mobile is currently in development and is not distributed yet. If you want to try it out, you can build it from source.

## Quickstart

> [!NOTE]
> Uses native modules so using Expo Go is not supported. You need to use the Expo Dev Client.

This app has three variants:

- `development`: Expo dev client, installable side-by-side as `T3 Code Dev`
- `preview`: persistent internal preview build, installable side-by-side as `T3 Code Preview`
- `production`: store/release build as `T3 Code`

Run commands from `apps/mobile`.

T3 Connect is optional and disabled in a fresh clone. Public configuration belongs in the
repository-root `.env` or `.env.local`, not an `apps/mobile/.env` file. See
[`../../.env.example`](../../.env.example).

## Development

Start Metro for the dev client:

```bash
vp run dev:client
```

Build and run the local iOS dev client:

```bash
vp run ios:dev
```

For local signing, set the Apple Team ID and a bundle identifier you control independently from the
capability profile. A paid Apple Developer Program **Individual** membership can create App Store and
TestFlight distributions. Xcode's free **Personal Team** can only install development builds on your own
devices; it cannot upload to TestFlight, and its provisioning profiles do not support all capabilities.

Use the reduced capability profile when your App ID cannot provision the upstream capabilities. It
omits the widget and share extensions, push and associated-domain entitlements, and native Sign in
with Apple. Builds without this profile retain the full upstream capabilities.

```bash
T3CODE_IOS_TEAM_ID=ABC1234567 \
T3CODE_IOS_BUNDLE_ID=com.example.t3code.dev \
T3CODE_IOS_CAPABILITY_PROFILE=reduced \
vp run ios:dev
```

The team, bundle identifier, and capability profile are separate settings. For example, a custom App ID
can still use the full profile when its Apple provisioning and upstream services authorize that team,
bundle identifier, and every required entitlement.

On a machine without an existing Apple Development signing identity or provisioning profile, open the
generated `ios/*.xcworkspace` in Xcode and build once with automatic signing enabled. Xcode may need
to create the signing certificate and profile before `expo run:ios` can install on a physical device.

Build and install a self-contained Release app that does not need Metro:

```bash
vp run ios:release
```

A reduced-capability Release build uses the same independent signing settings:

```bash
T3CODE_IOS_TEAM_ID=ABC1234567 \
T3CODE_IOS_BUNDLE_ID=com.example.t3code \
T3CODE_IOS_CAPABILITY_PROFILE=reduced \
vp run ios:release
```

Build and run the local iOS preview app:

```bash
vp run ios:preview
```

Force the review diff highlighter engine:

```bash
EXPO_PUBLIC_REVIEW_HIGHLIGHTER_ENGINE=javascript vp run ios:dev
```

`javascript` is the default and recommended setting for the review diff screen. Set `EXPO_PUBLIC_REVIEW_HIGHLIGHTER_ENGINE=native` only when you explicitly want to test the native Shiki engine.

Inspect the resolved Expo config for a variant:

```bash
vp run config:dev
vp run config:preview
```

Run static checks for mobile native code:

```bash
node ../../scripts/mobile-native-static-check.ts
```

The native lint task runs SwiftLint for Swift plus ktlint and detekt for Kotlin. Missing native tools are reported as warnings and skipped locally. CI installs the default toolset from `apps/mobile/Brewfile` before running the native checks.

## Local TestFlight preparation

TestFlight requires a paid Apple Developer Program membership. A paid **Individual** account is
sufficient; a free Xcode **Personal Team** is not. Put non-secret local release settings in the
repository-root `.env.local` (which is ignored by Git), replacing the example team and bundle values
with ones registered to your Apple Developer account:

```dotenv
APP_VARIANT=production
T3CODE_MOBILE_DISTRIBUTION=independent
T3CODE_IOS_TEAM_ID=ABC1234567
T3CODE_IOS_BUNDLE_ID=com.example.t3code
T3CODE_IOS_CAPABILITY_PROFILE=reduced
T3CODE_MOBILE_APP_VERSION=0.1.0
T3CODE_IOS_BUILD_NUMBER=1
```

`independent` distribution disables Expo Updates and removes the upstream `pingdotgg` owner and EAS
project ID. The production variant still supplies the production name, icons, splash assets, and
`t3code` URL scheme. Repository-root `.env.local` applies to every mobile command, so remove or
override these release values before returning to a normal development or upstream build. Inspect the
resolved configuration before generating the native project:

```bash
vp run config:prod
```

Then generate the iOS project locally and open its workspace in Xcode:

```bash
EXPO_NO_GIT_STATUS=1 vp exec expo prebuild --clean --platform ios
open ios/*.xcworkspace
```

Use Xcode automatic signing for the configured team, select a generic iOS device destination, and use
**Product > Archive** when you are ready to prepare a distribution archive. Increment
`T3CODE_IOS_BUILD_NUMBER` before every App Store Connect upload; App Store Connect will reject a
second upload with the same app version and build number. TestFlight builds expire 90 days after they
are uploaded.

> [!WARNING]
> Do not use the repository's upstream EAS build or submit configuration for an independent release.
> `apps/mobile/eas.json`, the `pingdotgg` EAS project, and its update channels belong to the upstream
> app. Build and distribute the independent bundle locally through Xcode, and remove or unset the
> independent values before running any upstream `eas:*` command.

## EAS Builds

CI uses Expo fingerprinting with the `preview:dev` profile to reuse an existing compatible build when possible, or start a new internal EAS build when native runtime inputs change. Production and default local builds continue to use the `appVersion` runtime policy.

For preview or production EAS environments, set `T3CODE_CLERK_PUBLISHABLE_KEY`,
`T3CODE_CLERK_JWT_TEMPLATE`, and `T3CODE_RELAY_URL`
as EAS environment variables. Expo config maps the canonical values into the mobile build.

Create a PR preview dev-client build manually:

```bash
vp run eas:ios:preview:dev
```

Create a cloud dev-client build:

```bash
vp run eas:ios:dev
```

Create a persistent preview build:

```bash
vp run eas:ios:preview
```

Android equivalents:

```bash
vp run eas:android:dev
vp run eas:android:preview:dev
vp run eas:android:preview
```
