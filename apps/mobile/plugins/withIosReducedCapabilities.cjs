const { withEntitlementsPlist } = require("expo/config-plugins");

const RESTRICTED_ENTITLEMENTS = [
  "aps-environment",
  "com.apple.developer.applesignin",
  "com.apple.developer.associated-domains",
  "com.apple.security.application-groups",
];

function removeIosReducedCapabilities(entitlements) {
  for (const entitlement of RESTRICTED_ENTITLEMENTS) {
    delete entitlements[entitlement];
  }

  return entitlements;
}

module.exports = function withIosReducedCapabilities(config) {
  return withEntitlementsPlist(config, (modConfig) => {
    removeIosReducedCapabilities(modConfig.modResults);
    return modConfig;
  });
};

module.exports.removeIosReducedCapabilities = removeIosReducedCapabilities;
