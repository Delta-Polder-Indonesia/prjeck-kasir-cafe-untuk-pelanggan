import { randomUUID } from "node:crypto";
import { canTransitionPaymentStatus, type Order } from "../domain/entities/order.js";
import type { AuditLogRepository } from "../domain/repositories/audit-log-repository.js";
import type { OrderRepository } from "../domain/repositories/order-repository.js";
import { AppError, NotFoundError } from "./errors.js";
import { validatePaymentInput } from "./validators/order-validator.js";

type Dependencies = {
  orders: OrderRepository;
  auditLogs: AuditLogRepository;
};

export class UpdateOrderPaymentUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(orderId: string, rawInput: unknown, actor: string): Promise<Order> {
    const paymentStatus = validatePaymentInput(rawInput);
    const current = await this.deps.orders.findById(orderId);
    if (!current) {
      throw new NotFoundError("Order tidak ditemukan");
    }

    if (!canTransitionPaymentStatus(current.paymentStatus, paymentStatus)) {
      throw new AppError(`Payment transition tidak valid: ${current.paymentStatus} -> ${paymentStatus}`, 409);
    }

    const next: Order = {
      ...current,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.deps.orders.update(next);

    await this.deps.auditLogs.add({
      id: randomUUID(),
      orderId,
      action: "payment_changed",
      before: current,
      after: { paymentStatus: updated.paymentStatus, updatedAt: updated.updatedAt },
      actor,
      createdAt: updated.updatedAt,
    });

    return updated;
  }
}
