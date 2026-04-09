import type { Order } from "../entities/order.js";

export type OrderCreatedEvent = {
  event: "order.created";
  order: Order;
};

export interface KitchenPrinter {
  printNewOrder(payload: OrderCreatedEvent): Promise<void>;
}
