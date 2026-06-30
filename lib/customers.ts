import { api } from './api';

export type Customer = {
  id: string;
  tenantId: string;
  phone: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

export const findCustomerByPhone = (phone: string) =>
  api.get<{ customer: Customer }>(`/customers?phone=${encodeURIComponent(phone)}`).then((r) => r.customer);

export const createCustomer = (input: { phone: string; firstName: string; lastName: string }) =>
  api.post<{ customer: Customer }>('/customers', input).then((r) => r.customer);
