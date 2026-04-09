import type { OrderCreatedEvent, KitchenPrinter } from "../../domain/services/kitchen-printer.js";
import type { AppLogger } from "../../domain/services/app-logger.js";

export class MockKitchenPrinter implements KitchenPrinter {
  constructor(private readonly logger: AppLogger) {}

  async printNewOrder(payload: OrderCreatedEvent): Promise<void> {
    this.logger.info("Kitchen printer triggered", {
      event: payload.event,
      orderNumber: payload.order.orderNumber,
      totalItems: payload.order.items.reduce((sum, item) => sum + item.qty, 0),
    });
  }
}
