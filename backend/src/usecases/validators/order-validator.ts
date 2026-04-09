import type { CreateOrderInput, OrderStatus, PaymentStatus } from "../../domain/entities/order.js";
import { AppError } from "../errors.js";

const validOrderTypes = new Set(["dine-in", "delivery"]);
const validStatuses = new Set(["pending", "cooking", "done", "canceled"]);
const validPayments = new Set(["unpaid", "paid"]);

export function validateCreateOrderInput(input: unknown): asserts input is CreateOrderInput {
  if (!input || typeof input !== "object") {
    throw new AppError("Body request tidak valid", 400);
  }

  const candidate = input as Partial<CreateOrderInput>;

  if (!candidate.table || typeof candidate.table !== "string") {
    throw new AppError("Field table wajib diisi", 400);
  }
  if (!candidate.orderType || !validOrderTypes.has(candidate.orderType)) {
    throw new AppError("Field orderType tidak valid", 400);
  }
  if (!candidate.customerName || typeof candidate.customerName !== "string") {
    throw new AppError("Field customerName wajib diisi", 400);
  }
  if (!Array.isArray(candidate.items) || candidate.items.length === 0) {
    throw new AppError("Items tidak boleh kosong", 400);
  }

  for (const item of candidate.items) {
    if (!item.productId || typeof item.productId !== "string") {
      throw new AppError("Item productId tidak valid", 400);
    }
    if (!item.name || typeof item.name !== "string") {
      throw new AppError("Item name tidak valid", 400);
    }
    if (typeof item.price !== "number" || Number.isNaN(item.price) || item.price < 0) {
      throw new AppError("Item price tidak valid", 400);
    }
    if (typeof item.qty !== "number" || !Number.isInteger(item.qty) || item.qty <= 0) {
      throw new AppError("Item qty tidak valid", 400);
    }
  }

  if (candidate.paymentStatus && !validPayments.has(candidate.paymentStatus)) {
    throw new AppError("Field paymentStatus tidak valid", 400);
  }
}

export function validateStatusInput(input: unknown): OrderStatus {
  if (!input || typeof input !== "object") {
    throw new AppError("Body request tidak valid", 400);
  }
  const status = (input as { status?: string }).status;
  if (!status || !validStatuses.has(status)) {
    throw new AppError("Field status tidak valid", 400);
  }
  return status as OrderStatus;
}

export function validatePaymentInput(input: unknown): PaymentStatus {
  if (!input || typeof input !== "object") {
    throw new AppError("Body request tidak valid", 400);
  }
  const paymentStatus = (input as { paymentStatus?: string }).paymentStatus;
  if (!paymentStatus || !validPayments.has(paymentStatus)) {
    throw new AppError("Field paymentStatus tidak valid", 400);
  }
  return paymentStatus as PaymentStatus;
}
