import type { Product } from "../domain/entities/product.js";
import type { ProductRepository } from "../domain/repositories/product-repository.js";

export class FetchProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.products.listActive();
  }
}
