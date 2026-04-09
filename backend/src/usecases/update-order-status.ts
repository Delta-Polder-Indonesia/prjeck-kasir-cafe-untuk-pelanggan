import { randomUUID } from "node:crypto";
import { canTransitionOrderStatus, type Order } from "../domain/entities/order.js";
import type { AuditLogRepository } from "../domain/repositories/audit-log-repository.js";
import type { OrderRepository } from "../domain/repositories/order-repository.js";
import { NotFoundError, AppError } from "./errors.js";
import { validateStatusInput } from "./validators/order-validator.js";

type Dependencies = {
  orders: OrderRepository;
  auditLogs: AuditLogRepository;
};

export class UpdateOrderStatusUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(orderId: string, rawInput: unknown, actor: string): Promise<Order> {
    const status = validateStatusInput(rawInput);
    const current = await this.deps.orders.findById(orderId);
    if (!current) {
      throw new NotFoundError("Order tidak ditemukan");
    }

    if (!canTransitionOrderStatus(current.status, status)) {
      throw new AppError(`Status transition tidak valid: ${current.status} -> ${status}`, 409);
    }

    const next: Order = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.deps.orders.update(next);

    await this.deps.auditLogs.add({
      id: randomUUID(),
      orderId: orderId,
      action: "status_changed",
      before: current,
      after: { status: updated.status, updatedAt: updated.updatedAt },
      actor,
      createdAt: updated.updatedAt,
    });

    return updated;
  }
}
