import type { Product } from "../entities/product.js";

export interface ProductRepository {
  listActive(): Promise<Product[]>;
}
