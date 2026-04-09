import { randomUUID } from "node:crypto";
import type { CreateOrderInput, Order } from "../domain/entities/order.js";
import type { AuditLogRepository } from "../domain/repositories/audit-log-repository.js";
import type { OrderRepository } from "../domain/repositories/order-repository.js";
import type { AppLogger } from "../domain/services/app-logger.js";
import type { KitchenPrinter } from "../domain/services/kitchen-printer.js";
import type { OrderNumberGenerator } from "../domain/services/order-number-generator.js";
import { validateCreateOrderInput } from "./validators/order-validator.js";

type Dependencies = {
  orders: OrderRepository;
  auditLogs: AuditLogRepository;
  orderNumberGenerator: OrderNumberGenerator;
  kitchenPrinter: KitchenPrinter;
  logger: AppLogger;
};

export class CreateOrderUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(rawInput: unknown, actor: string): Promise<Order> {
    validateCreateOrderInput(rawInput);
    const input = rawInput as CreateOrderInput;
    const now = new Date();
    const timestamp = now.toISOString();

    const order: Order = {
      id: randomUUID(),
      orderNumber: await this.deps.orderNumberGenerator.generate(now),
      table: input.table.trim(),
      orderType: input.orderType,
      customerName: input.customerName.trim(),
      items: input.items,
      total: input.items.reduce((sum, item) => sum + item.price * item.qty, 0),
      status: "pending",
      paymentStatus: input.paymentStatus ?? "unpaid",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const saved = await this.deps.orders.create(order);

    await this.deps.auditLogs.add({
      id: randomUUID(),
      orderId: saved.id,
      action: "created",
      before: null,
      after: saved,
      actor,
      createdAt: timestamp,
    });

    // Printer failures are logged, but order creation remains successful.
    void this.deps.kitchenPrinter
      .printNewOrder({ event: "order.created", order: saved })
      .catch((error: unknown) => {
        this.deps.logger.error("Kitchen print hook failed", {
          orderId: saved.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return saved;
  }
}
