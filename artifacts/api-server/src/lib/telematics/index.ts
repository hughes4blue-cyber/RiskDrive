import { SamsaraClient } from "./samsara";
import { GeotabClient } from "./geotab";
import type { TelematicsClient, ProviderName } from "./types";

export const SUPPORTED_PROVIDERS: ProviderName[] = ["samsara", "geotab"];

/**
 * Builds a provider client from a connection's decrypted credential JSON blob.
 * Samsara expects `{ apiToken }`; Geotab expects `{ server, database, username, password }`.
 */
export function createClient(provider: string, credentialsJson: string): TelematicsClient {
  let creds: unknown;
  try {
    creds = JSON.parse(credentialsJson);
  } catch {
    throw new Error("Stored credentials are corrupt or unreadable");
  }
  switch (provider) {
    case "samsara":
      return new SamsaraClient(creds as { apiToken: string });
    case "geotab":
      return new GeotabClient(creds as { server: string; database: string; username: string; password: string });
    default:
      throw new Error(`Unsupported telematics provider: ${provider}`);
  }
}

export * from "./types";
export { syncConnection } from "./sync";
export type { SyncResult } from "./sync";
