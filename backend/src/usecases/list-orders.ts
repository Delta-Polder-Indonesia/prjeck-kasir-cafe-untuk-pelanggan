import type { ListOrdersQuery } from "../domain/entities/order.js";
import type { OrderRepository } from "../domain/repositories/order-repository.js";
import { AppError } from "./errors.js";

const allowedScope = new Set(["cashier-active", "admin-history"]);
const allowedStatus = new Set(["pending", "cooking", "done", "canceled"]);
const allowedPayment = new Set(["unpaid", "paid"]);

export class ListOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(rawQuery: unknown): Promise<{ orders: Awaited<ReturnType<OrderRepository["list"]>>["orders"]; total: number; page: number; limit: number }> {
    const query = this.parseQuery(rawQuery);
    const { orders, total } = await this.orders.list(query);
    return {
      orders,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private parseQuery(rawQuery: unknown): Required<Pick<ListOrdersQuery, "page" | "limit">> & Omit<ListOrdersQuery, "page" | "limit"> {
    const input = (rawQuery && typeof rawQuery === "object" ? rawQuery : {}) as Record<string, string | undefined>;

    const page = this.readPositiveInt(input.page, 1, "page");
    const limit = this.readPositiveInt(input.limit, 20, "limit");
    const scope = input.scope;
    const status = input.status;
    const paymentStatus = input.paymentStatus;
    const search = input.search?.trim();

    if (scope && !allowedScope.has(scope)) {
      throw new AppError("Query scope tidak valid", 400);
    }
    if (status && !allowedStatus.has(status)) {
      throw new AppError("Query status tidak valid", 400);
    }
    if (paymentStatus && !allowedPayment.has(paymentStatus)) {
      throw new AppError("Query paymentStatus tidak valid", 400);
    }

    return {
      page,
      limit,
      scope: scope as ListOrdersQuery["scope"],
      status: status as ListOrdersQuery["status"],
      paymentStatus: paymentStatus as ListOrdersQuery["paymentStatus"],
      search,
    };
  }

  private readPositiveInt(value: string | undefined, fallback: number, field: string): number {
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new AppError(`Query ${field} harus integer >= 1`, 400);
    }
    return parsed;
  }
}
