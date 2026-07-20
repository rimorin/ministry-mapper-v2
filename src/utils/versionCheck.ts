interface VersionInfo {
  version: string;
}

// cache: "no-store" bypasses the browser's HTTP cache regardless of server
// headers, so a stale cached response can't mask a real version change.
export async function checkForNewVersion(): Promise<boolean> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) return false;
    const data: VersionInfo = await response.json();
    return data.version !== import.meta.env.VITE_APP_VERSION;
  } catch {
    return false;
  }
}
