import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { createPublicOrder, fetchOrderStatus, fetchProducts, fetchPublicSettings } from "./api";
import type { CartItem, Category, OrderSummary, OrderType, PaymentChoice, Product, PublicSettings } from "./types";

const categories: Category[] = ["All Categories", "Minuman", "Makanan", "Combo"];

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function estimateReadyText(createdAt: string | undefined, minutes: number): string {
  const base = createdAt ? new Date(createdAt) : new Date();
  const eta = new Date(base.getTime() + minutes * 60_000);
  return eta.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const terminalOrderStatus = new Set(["done", "canceled"]);

function statusLabel(status: OrderSummary["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "cooking":
      return "Cooking";
    case "done":
      return "Done";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<PublicSettings>({
    storeName: "BluePOS Restoran",
    readyEstimateMinutes: 15,
    tableOptions: ["A1", "A2", "A3", "A4", "Takeaway"],
    qsImageUrl: "",
  });
  const [category, setCategory] = useState<Category>("All Categories");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [table, setTable] = useState("A1");
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [customerName, setCustomerName] = useState("");
  const [payment, setPayment] = useState<PaymentChoice>("cashier");
  const [sending, setSending] = useState(false);
  const [tracking, setTracking] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [items, appSettings] = await Promise.all([fetchProducts(), fetchPublicSettings()]);
        setProducts(items);
        setSettings(appSettings);
        setTable(appSettings.tableOptions[0] ?? "Takeaway");
      } catch (err) {
        console.error("Initialization failed:", err);
        alert(`Gagal memuat data: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!tracking?.id || terminalOrderStatus.has(tracking.status)) return;

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000/api").trim();
    const socket = io(apiBase.replace("/api", ""));

    socket.on("connect", () => console.log("[WS] Connected"));
    socket.on("order:update", (updated: OrderSummary) => {
      if (updated.id === tracking.id) {
        setTracking(prev => {
          if (!prev || updated.updatedAt >= prev.updatedAt) {
            return updated;
          }
          return prev;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tracking?.id, tracking?.status]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((item) => {
      const byCategory = category === "All Categories" || item.category === category;
      const bySearch = !term || item.name.toLowerCase().includes(term);
      return byCategory && bySearch;
    });
  }, [products, category, search]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.qty, 0), [cart]);

  function addToCart(product: Product): void {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing) return [...prev, { product, qty: 1 }];
      return prev.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    });
  }

  function updateQty(productId: string, delta: number): void {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  }

  async function submitOrder(): Promise<void> {
    if (!cart.length || sending) return;
    setSending(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const order = await createPublicOrder({
        table,
        orderType,
        customerName,
        cart,
        payment,
        idempotencyKey
      });
      setTracking(order);
      setCart([]);
      alert("Pesanan berhasil dikirim. Tunjukkan nomor order saat ambil pesanan.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal kirim pesanan");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1.6fr_1fr] md:px-6 lg:px-8">
        <main className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{settings.storeName}</h1>
            <p className="text-sm text-slate-300 md:text-base">Pesan lewat HP, masuk langsung ke daftar order kasir.</p>
          </header>

          <section className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`rounded-lg px-3 py-2 text-sm transition ${item === category ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400"
                onClick={() => addToCart(product)}
              >
                <img src={product.image} alt={product.name} loading="lazy" className="h-36 w-full object-cover" />
                <div className="space-y-1 p-3">
                  <strong className="line-clamp-1 block text-sm font-semibold text-white">{product.name}</strong>
                  <span className="block text-xs text-slate-400">{product.category}</span>
                  <b className="text-sm text-cyan-300">{rupiah(product.price)}</b>
                </div>
              </button>
            ))}
          </section>
        </main>

        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:sticky md:top-6 md:h-fit">
          <h2 className="text-lg font-semibold text-white">Keranjang</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/80 p-2">
                  <span className="text-sm text-slate-100">{item.product.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="h-7 w-7 rounded-md bg-slate-700 text-sm transition hover:bg-slate-600"
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      -
                    </button>
                    <span className="min-w-5 text-center text-sm">{item.qty}</span>
                    <button
                      className="h-7 w-7 rounded-md bg-slate-700 text-sm transition hover:bg-slate-600"
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pemesan"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            />
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            >
              {settings.tableOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            >
              <option value="dine-in">Dine in</option>
              <option value="delivery">Takeaway / Delivery</option>
            </select>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentChoice)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            >
              <option value="cashier">Bayar di Kasir</option>
              <option value="qs">Bayar QS (langsung lunas)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-sm">
            <span className="text-slate-300">Total</span>
            <strong className="text-lg text-cyan-300">{rupiah(total)}</strong>
          </div>

          <p className="text-xs text-slate-400">Estimasi siap: {settings.readyEstimateMinutes} menit</p>
          {payment === "qs" && settings.qsImageUrl ? (
            <img className="h-40 w-full rounded-xl object-cover" src={settings.qsImageUrl} alt="QR pembayaran" />
          ) : null}

          <button
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={!cart.length || sending}
            onClick={submitOrder}
          >
            {sending ? "Mengirim..." : "Kirim Pesanan"}
          </button>

          {tracking && (
            <section className="space-y-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm">
              <h3 className="font-semibold text-cyan-200">Status Pesanan</h3>
              <p>
                Nomor: <b>{tracking.orderNumber}</b>
              </p>
              <p className="flex items-center gap-2">
                Status: <b>{statusLabel(tracking.status).toUpperCase()}</b>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              </p>
              <p>
                Pembayaran: <b>{tracking.paymentStatus.toUpperCase()}</b>
              </p>
              <p>
                Estimasi siap: <b>{estimateReadyText(tracking.createdAt, settings.readyEstimateMinutes)}</b>
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
