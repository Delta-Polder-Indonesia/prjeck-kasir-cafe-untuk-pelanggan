import type { ListOrdersQuery, Order } from "../../domain/entities/order.js";
import type { OrderRepository } from "../../domain/repositories/order-repository.js";

type ListInput = Required<Pick<ListOrdersQuery, "page" | "limit">> & Omit<ListOrdersQuery, "page" | "limit">;

export class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async create(order: Order): Promise<Order> {
    this.store.set(order.id, structuredClone(order));
    return structuredClone(order);
  }

  async findById(id: string): Promise<Order | null> {
    const found = this.store.get(id);
    return found ? structuredClone(found) : null;
  }

  async update(order: Order): Promise<Order> {
    this.store.set(order.id, structuredClone(order));
    return structuredClone(order);
  }

  async list(query: ListInput): Promise<{ orders: Order[]; total: number }> {
    const all = Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const filtered = all.filter((order) => {
      if (query.scope === "cashier-active" && order.status === "canceled") return false;
      if (query.status && order.status !== query.status) return false;
      if (query.paymentStatus && order.paymentStatus !== query.paymentStatus) return false;
      if (query.search) {
        const needle = query.search.toLowerCase();
        const haystack = `${order.orderNumber} ${order.customerName} ${order.table}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;

    return {
      orders: filtered.slice(start, end).map((item) => structuredClone(item)),
      total: filtered.length,
    };
  }
}
