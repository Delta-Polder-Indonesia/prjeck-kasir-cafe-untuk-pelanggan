export type OrderType = "dine-in" | "delivery";
export type OrderStatus = "pending" | "cooking" | "done" | "canceled";
export type PaymentStatus = "unpaid" | "paid";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  table: string;
  orderType: OrderType;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  table: string;
  orderType: OrderType;
  customerName: string;
  paymentStatus?: PaymentStatus;
  items: OrderItem[];
};

export type OrderScope = "cashier-active" | "admin-history";

export type ListOrdersQuery = {
  scope?: OrderScope;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export type OrderAuditAction = "created" | "status_changed" | "payment_changed";

export type OrderAuditLog = {
  id: string;
  orderId: string;
  action: OrderAuditAction;
  before: Partial<Order> | null;
  after: Partial<Order>;
  actor: string;
  createdAt: string;
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const map: Record<OrderStatus, OrderStatus[]> = {
    pending: ["cooking", "canceled"],
    cooking: ["done", "canceled"],
    done: ["canceled"],
    canceled: [],
  };
  return map[from].includes(to);
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return from === "unpaid" && to === "paid";
}
