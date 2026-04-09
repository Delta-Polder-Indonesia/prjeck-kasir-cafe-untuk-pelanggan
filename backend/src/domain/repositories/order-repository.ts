import type { ListOrdersQuery, Order } from "../entities/order.js";

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  update(order: Order): Promise<Order>;
  list(query: Required<Pick<ListOrdersQuery, "page" | "limit">> & Omit<ListOrdersQuery, "page" | "limit">): Promise<{ orders: Order[]; total: number }>;
}
