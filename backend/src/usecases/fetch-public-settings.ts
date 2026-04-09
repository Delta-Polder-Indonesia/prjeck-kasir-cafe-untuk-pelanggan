import type { PublicSettings } from "../domain/entities/settings.js";
import type { SettingsRepository } from "../domain/repositories/settings-repository.js";

export class FetchPublicSettingsUseCase {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<PublicSettings> {
    return this.settings.getPublicSettings();
  }
}
