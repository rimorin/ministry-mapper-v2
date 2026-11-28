interface VersionInfo {
  version: string;
  minVersion?: string;
}

// "required": the running build is below the served minVersion.
type VersionStatus = "current" | "available" | "required";

const isOlder = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true }) < 0;

// cache: "no-store" bypasses the browser's HTTP cache regardless of server
// headers, so a stale cached response can't mask a real version change.
export async function checkVersion(): Promise<VersionStatus> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) return "current";
    const { version, minVersion }: VersionInfo = await response.json();
    const running = import.meta.env.VITE_APP_VERSION;
    if (version === running) return "current";
    // A floor above the served version is a mistake; forcing reloads then
    // would never reach a build that meets it.
    if (
      minVersion &&
      isOlder(running, minVersion) &&
      !isOlder(version, minVersion)
    ) {
      return "required";
    }
    return "available";
  } catch {
    return "current";
  }
}
