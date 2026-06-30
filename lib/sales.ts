import { api } from './api';

export type SaleItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Sale = {
  id: string;
  tenantId: string;
  totalCents: number;
  amountPaidCents: number;
  changeCents: number;
  createdAt: string;
  items?: SaleItem[];
};

export const createSale = (items: { productId: string; quantity: number }[], amountPaidCents: number) =>
  api.post<{ sale: Sale }>('/sales', { items, amountPaidCents }).then((r) => r.sale);

export const listSales = () => api.get<{ items: Sale[] }>('/sales').then((r) => r.items);

export const getSale = (id: string) => api.get<{ sale: Sale }>(`/sales/${id}`).then((r) => r.sale);
