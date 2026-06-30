import { api } from './api';

export type Product = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  priceCents: number;
  status: 'active' | 'inactive';
  imageUrl: string | null;
  createdAt: string;
};

type ProductInput = {
  name?: string;
  priceCents?: number;
  categoryId?: string | null;
  imageUrl?: string | null;
  status?: 'active' | 'inactive';
};

export const listProducts = () =>
  api.get<{ items: Product[] }>('/products').then((r) => r.items);

export const getProduct = (id: string) =>
  api.get<{ product: Product }>(`/products/${id}`).then((r) => r.product);

export const createProduct = (input: ProductInput) =>
  api.post<{ product: Product }>('/products', input).then((r) => r.product);

export const updateProduct = (id: string, input: ProductInput) =>
  api.patch<{ product: Product }>(`/products/${id}`, input).then((r) => r.product);

// Helpers de precio: la API usa centavos; la UI muestra pesos.
export const toPesos = (cents: number) => (cents / 100).toFixed(2);
export const toCents = (pesos: string) => Math.round(parseFloat(pesos || '0') * 100);
