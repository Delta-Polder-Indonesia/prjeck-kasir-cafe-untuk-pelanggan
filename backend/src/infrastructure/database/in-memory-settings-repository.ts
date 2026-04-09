import type { PublicSettings } from "../../domain/entities/settings.js";
import type { SettingsRepository } from "../../domain/repositories/settings-repository.js";

const defaultSettings: PublicSettings = {
  storeName: "BluePOS Restoran",
  readyEstimateMinutes: 15,
  tableOptions: ["A1", "A2", "A3", "A4", "Takeaway"],
  qsImageUrl: "",
};

export class InMemorySettingsRepository implements SettingsRepository {
  async getPublicSettings(): Promise<PublicSettings> {
    return structuredClone(defaultSettings);
  }
}
