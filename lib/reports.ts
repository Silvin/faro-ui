import { api } from './api';

export type PaymentBreakdown = { method: 'cash' | 'card'; count: number; totalCents: number };
export type CategoryBreakdown = { categoryName: string; quantity: number; totalCents: number };
export type HourBreakdown = { hour: number; count: number; totalCents: number };

export type SalesReport = {
  totalCents: number;
  salesCount: number;
  byPaymentMethod: PaymentBreakdown[];
  byCategory: CategoryBreakdown[];
  byHour: HourBreakdown[];
};

export const getSalesReport = (params: { from: string; to: string; tz: number }) => {
  const q = new URLSearchParams({ from: params.from, to: params.to, tz: String(params.tz) });
  return api.get<SalesReport>(`/reports/sales?${q.toString()}`);
};
