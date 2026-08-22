import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Application from "expo-application";
import { useGetAppVersionQuery } from "@/services/appVersionService";

// Compare la version simple X.Y.Z : renvoie true si `latest` > `current`.
function isNewer(current: string, latest: string): boolean {
  const c = current.split(".").map(n => parseInt(n, 10) || 0);
  const l = latest.split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const a = l[i] ?? 0, b = c[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

/**
 * Compare la version installée à la dernière version publiée sur le
 * PlayStore / App Store (renseignée par l'admin dans admin-bimnext).
 * Si une nouvelle version existe, propose d'ouvrir la fiche du store.
 */
export function useAppVersionCheck() {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const { data } = useGetAppVersionQuery(platform);
  const remote = data?.data;

  const currentVersion = Application.nativeApplicationVersion || "0.0.0";
  // L'utilisateur peut fermer la bannière (après avoir cliqué "aller sur le store"
  // par ex.) ; elle reste masquée tant qu'aucune version plus récente n'apparaît.
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const available = useMemo(() => {
    if (!remote?.latestVersion) return false;
    if (remote.promptEnabled === false) return false; // coupé depuis l'admin
    if (dismissedVersion === remote.latestVersion) return false;
    return isNewer(currentVersion, remote.latestVersion);
  }, [remote, currentVersion, dismissedVersion]);

  const dismiss = useCallback(() => {
    if (remote?.latestVersion) setDismissedVersion(remote.latestVersion);
  }, [remote?.latestVersion]);

  return {
    available,
    latestVersion: remote?.latestVersion,
    storeUrl: remote?.storeUrl,
    releaseNotes: remote?.releaseNotes,
    forceUpdate: !!remote?.forceUpdate,
    dismiss,
  };
}
