import type { PublicSettings } from "../entities/settings.js";

export interface SettingsRepository {
  getPublicSettings(): Promise<PublicSettings>;
}
