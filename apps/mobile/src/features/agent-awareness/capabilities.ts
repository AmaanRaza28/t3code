import { hasFullIosCapabilities } from "../../lib/iosCapabilities";

export function supportsAgentAwarenessPush() {
  return hasFullIosCapabilities();
}
