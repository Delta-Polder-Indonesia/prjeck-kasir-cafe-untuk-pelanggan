import type { OrderAuditLog } from "../../domain/entities/order.js";
import type { AuditLogRepository } from "../../domain/repositories/audit-log-repository.js";

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly logs: OrderAuditLog[] = [];

  async add(log: OrderAuditLog): Promise<void> {
    this.logs.push(structuredClone(log));
  }

  async listByOrderId(orderId: string): Promise<OrderAuditLog[]> {
    return this.logs.filter((log) => log.orderId === orderId).map((log) => structuredClone(log));
  }
}
