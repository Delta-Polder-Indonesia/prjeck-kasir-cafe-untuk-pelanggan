import type {
  ApiResponse,
  CreatePublicOrderInput,
  OrderSummary,
  OrdersListData,
  OrdersListQuery,
  Product,
  PublicOrderStatus,
  PublicSettings,
  UpdateOrderPaymentInput,
  UpdateOrderStatusInput,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000/api").trim();

const defaultPublicSettings: PublicSettings = {
  storeName: "BluePOS Restoran",
  readyEstimateMinutes: 15,
  tableOptions: ["A1", "A2", "A3", "A4", "Takeaway"],
  qsImageUrl: "",
};

type OrderData = { order: OrderSummary };

function withJsonHeaders(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  };
}

export function mapStatusFromApi(status: string): PublicOrderStatus {
  switch (status) {
    case "open":
      return "pending";
    case "sent":
      return "cooking";
    case "paid":
      return "done";
    case "cancelled":
      return "canceled";
    default:
      return status as PublicOrderStatus;
  }
}

export function mapStatusToApi(status: PublicOrderStatus): string {
  switch (status) {
    case "pending":
      return "open";
    case "cooking":
      return "sent";
    case "done":
      return "paid";
    case "canceled":
      return "cancelled";
    default:
      return status;
  }
}

function mapOrder(order: any): OrderSummary {
  if (!order) return order;
  return {
    ...order,
    id: order.id || "",
    orderNumber: order.orderNumber || "0000",
    status: mapStatusFromApi(order.status || "open"),
    paymentStatus: order.paymentStatus || "unpaid",
    createdAt: order.createdAt || new Date().toISOString(),
    items: order.items || [],
    total: order.total || 0,
  };
}

function toQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const output = search.toString();
  return output ? `?${output}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, withJsonHeaders(init));
    let payload: ApiResponse<T> | null = null;

    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      console.error("API ERROR: Response backend tidak valid (harus JSON)", { path });
      throw new Error("Response backend tidak valid (harus JSON)");
    }

    if (typeof payload.success !== "boolean") {
      console.error("API ERROR: Kontrak API tidak valid (field success wajib ada)", { path, payload });
      throw new Error("Kontrak API tidak valid: field success wajib ada");
    }

    if (!response.ok || !payload.success) {
      console.error("API ERROR:", payload.error || "Request gagal", { path, status: response.status });
      throw new Error(payload.error || "Request gagal");
    }

    return payload.data;
  } catch (error) {
    console.error("NETWORK/REQUEST ERROR:", error, { path });
    throw error;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await request<{ products: Product[] }>("/products");
  return data.products.filter((item) => item.isActive !== false);
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await request<{ settings: PublicSettings }>("/settings/public");
    return { ...defaultPublicSettings, ...data.settings };
  } catch {
    return defaultPublicSettings;
  }
}

export async function createPublicOrder(params: CreatePublicOrderInput): Promise<OrderSummary> {
  const body = {
    table: params.table,
    orderType: params.orderType,
    customerName: params.customerName || "Guest",
    paymentStatus: params.payment === "qs" ? "paid" : "unpaid",
    items: params.cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      qty: item.qty,
    })),
    idempotencyKey: params.idempotencyKey,
  };

  const data = await request<OrderData>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return mapOrder(data.order);
}

export async function fetchOrderStatus(orderId: string): Promise<OrderSummary> {
  const data = await request<OrderData>(`/orders/${orderId}`);
  return mapOrder(data.order);
}

export async function fetchOrders(query?: OrdersListQuery): Promise<OrdersListData> {
  const queryString = toQueryString({
    scope: query?.scope,
    status: query?.status,
    paymentStatus: query?.paymentStatus,
    search: query?.search,
    page: query?.page,
    limit: query?.limit,
  });

  const data = await request<OrdersListData>(`/orders${queryString}`);
  return {
    ...data,
    orders: data.orders.map(mapOrder),
  };
}

export async function fetchCashierActiveOrders(): Promise<OrderSummary[]> {
  const data = await fetchOrders({ scope: "cashier-active", page: 1, limit: 100 });
  return data.orders;
}

export async function fetchAdminOrderHistory(): Promise<OrderSummary[]> {
  const data = await fetchOrders({ scope: "admin-history", page: 1, limit: 100 });
  return data.orders;
}

export async function updateOrderStatus(orderId: string, payload: UpdateOrderStatusInput): Promise<OrderSummary> {
  const data = await request<OrderData>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: mapStatusToApi(payload.status) }),
  });
  return mapOrder(data.order);
}

export async function markOrderPaid(orderId: string): Promise<OrderSummary> {
  const payload: UpdateOrderPaymentInput = { paymentStatus: "paid" };
  const data = await request<OrderData>(`/orders/${orderId}/payment`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapOrder(data.order);
}
