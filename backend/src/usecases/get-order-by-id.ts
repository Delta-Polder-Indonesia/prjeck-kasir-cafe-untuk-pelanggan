import type { Order } from "../domain/entities/order.js";
import type { OrderRepository } from "../domain/repositories/order-repository.js";
import { NotFoundError } from "./errors.js";

export class GetOrderByIdUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order tidak ditemukan");
    }
    return order;
  }
}
