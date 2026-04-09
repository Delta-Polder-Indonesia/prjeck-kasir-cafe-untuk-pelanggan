import type { OrderAuditLog } from "../entities/order.js";

export interface AuditLogRepository {
  add(log: OrderAuditLog): Promise<void>;
  listByOrderId(orderId: string): Promise<OrderAuditLog[]>;
}
