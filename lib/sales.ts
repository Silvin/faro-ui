import { api } from './api';

export type SaleItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type PaymentMethod = 'cash' | 'card';

export type Sale = {
  id: string;
  tenantId: string;
  totalCents: number;
  amountPaidCents: number;
  changeCents: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items?: SaleItem[];
};

export const createSale = (
  items: { productId: string; quantity: number }[],
  paymentMethod: PaymentMethod,
  amountPaidCents: number,
) => api.post<{ sale: Sale }>('/sales', { items, paymentMethod, amountPaidCents }).then((r) => r.sale);

export const listSales = () => api.get<{ items: Sale[] }>('/sales').then((r) => r.items);

export const getSale = (id: string) => api.get<{ sale: Sale }>(`/sales/${id}`).then((r) => r.sale);
