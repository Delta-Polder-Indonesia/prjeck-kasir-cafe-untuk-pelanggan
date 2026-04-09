import type { AppLogger } from "../../domain/services/app-logger.js";

export class ConsoleLogger implements AppLogger {
  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, meta ?? {});
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta ?? {});
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, meta ?? {});
  }
}
