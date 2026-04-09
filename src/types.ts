export type Category = "All Categories" | "Minuman" | "Makanan" | "Combo";

export type ProductCategory = Exclude<Category, "All Categories">;

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  isActive?: boolean;
};

export type CartItem = {
  product: Product;
  qty: number;
};

export type OrderType = "dine-in" | "delivery";

export type PaymentChoice = "cashier" | "qs";

export type PaymentStatus = "unpaid" | "paid";

export type PublicOrderStatus = "pending" | "cooking" | "done" | "canceled";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export type PublicSettings = {
  storeName: string;
  readyEstimateMinutes: number;
  tableOptions: string[];
  qsImageUrl: string;
};

export type CreatePublicOrderInput = {
  table: string;
  orderType: OrderType;
  customerName: string;
  cart: CartItem[];
  payment: PaymentChoice;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  table: string;
  orderType: OrderType;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: PublicOrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrdersListQuery = {
  scope?: "cashier-active" | "admin-history";
  status?: PublicOrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export type OrdersListData = {
  orders: OrderSummary[];
  total: number;
  page: number;
  limit: number;
};

export type UpdateOrderStatusInput = {
  status: PublicOrderStatus;
};

export type UpdateOrderPaymentInput = {
  paymentStatus: PaymentStatus;
};

export type OrderStatus = OrderSummary;