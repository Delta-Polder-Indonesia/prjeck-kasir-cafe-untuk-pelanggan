# Blue POS Unified Order Contract (Single Source of Truth)

Dokumen ini adalah kontrak final agar customer app, kasir, admin, dan dapur memakai struktur data serta endpoint yang sama.

## 1) Standard Response Envelope

Semua endpoint wajib mengembalikan format ini:

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};
```

Catatan:
- `success: true` -> `data` wajib terisi.
- `success: false` -> `error` wajib terisi string yang bisa ditampilkan ke UI.

## 2) Canonical Order Schema

```ts
type OrderStatus = "pending" | "cooking" | "done" | "canceled";
type PaymentStatus = "unpaid" | "paid";
type OrderType = "dine-in" | "delivery";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
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
```

## 3) Final Endpoints

### POST `/orders`
Create order dari customer/public app.

Request:
```ts
type CreateOrderBody = {
  table: string;
  orderType: "dine-in" | "delivery";
  customerName: string;
  paymentStatus?: "unpaid" | "paid"; // qs => paid
  items: Array<{
    productId: string;
    name: string;
    price: number;
    qty: number;
  }>;
};
```

Response:
```ts
ApiResponse<{ order: Order }>
```

Server side rule:
- `orderNumber` auto-generated (unique, readable).
- `total` dihitung server: `sum(items.price * items.qty)`.
- default `status = pending`.
- default `paymentStatus = unpaid` kecuali request explicit paid (contoh QS).
- trigger kitchen printer hook setelah order tersimpan.

### GET `/orders/:id`
Tracking status order tunggal.

Response:
```ts
ApiResponse<{ order: Order }>
```

### GET `/orders`
List order untuk kasir/admin dengan query yang sama.

Query (opsional):
- `scope`: `cashier-active | admin-history`
- `status`: `pending | cooking | done | canceled`
- `paymentStatus`: `unpaid | paid`
- `search`: string (orderNumber/customer/table)
- `page`: number
- `limit`: number

Response:
```ts
ApiResponse<{
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}>
```

### PATCH `/orders/:id/status`
Update status order (`pending | cooking | done | canceled`).

Request:
```ts
{ status: "pending" | "cooking" | "done" | "canceled" }
```

Response:
```ts
ApiResponse<{ order: Order }>
```

### PATCH `/orders/:id/payment`
Update payment (`unpaid -> paid`).

Request:
```ts
{ paymentStatus: "unpaid" | "paid" }
```

Response:
```ts
ApiResponse<{ order: Order }>
```

## 4) Validation (Backend Wajib)

- Reject jika `items` kosong.
- Reject jika ada `qty <= 0` atau `price < 0`.
- `table`, `orderType`, `customerName` wajib valid.
- `status` hanya boleh dari enum resmi.
- `paymentStatus` hanya boleh `unpaid | paid`.
- Semua datetime pakai ISO-8601 (`new Date().toISOString()`).

## 5) Logging and Audit Trail

Simpan semua perubahan order (termasuk canceled) ke audit log.

```ts
type OrderAuditLog = {
  id: string;
  orderId: string;
  action: "created" | "status_changed" | "payment_changed";
  before: Partial<Order> | null;
  after: Partial<Order>;
  actor: string; // public/cashier/admin/system
  createdAt: string;
};
```

Cancel tidak boleh hard-delete order. Status cukup diubah ke `canceled` agar tetap muncul di history admin.

## 6) Kitchen Printer Hook

Trigger event saat order baru dibuat:

```ts
type OrderCreatedEvent = {
  event: "order.created";
  order: Order;
};

type KitchenPrinterHook = (payload: OrderCreatedEvent) => Promise<void>;
```

Recommended flow:
1. Save order ke DB (transaction commit).
2. Publish `order.created` ke queue/broker (RabbitMQ/Kafka/Redis stream).
3. Worker dapur consume event dan print.
4. Simpan hasil print (success/fail/retry) ke log.

Dengan flow ini, kegagalan printer tidak membuat order hilang.
