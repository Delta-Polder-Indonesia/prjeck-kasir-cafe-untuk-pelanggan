export type ProductCategory = "Minuman" | "Makanan" | "Combo";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  isActive: boolean;
};
