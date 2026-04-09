import type { OrderNumberGenerator } from "../../domain/services/order-number-generator.js";

export class InMemoryOrderNumberGenerator implements OrderNumberGenerator {
  private readonly counters = new Map<string, number>();

  async generate(now: Date): Promise<string> {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const dayKey = `${y}${m}${d}`;

    const next = (this.counters.get(dayKey) ?? 0) + 1;
    this.counters.set(dayKey, next);

    return `ORD-${dayKey}-${String(next).padStart(3, "0")}`;
  }
}
