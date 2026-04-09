import type { Product } from "../../domain/entities/product.js";
import type { ProductRepository } from "../../domain/repositories/product-repository.js";

const seedProducts: Product[] = [
  {
    id: "p-1",
    name: "Es Kopi Susu",
    category: "Minuman",
    price: 22000,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    id: "p-2",
    name: "Nasi Goreng Ayam",
    category: "Makanan",
    price: 30000,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    id: "p-3",
    name: "Paket Hemat Siang",
    category: "Combo",
    price: 45000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
];

export class InMemoryProductRepository implements ProductRepository {
  private readonly products = seedProducts;

  async listActive(): Promise<Product[]> {
    return this.products.filter((item) => item.isActive).map((item) => structuredClone(item));
  }
}
