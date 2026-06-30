import { api } from './api';

export type Category = {
  id: string;
  tenantId: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
};

export const listCategories = () =>
  api.get<{ items: Category[] }>('/categories').then((r) => r.items);

export const createCategory = (input: { name: string; sortOrder?: number }) =>
  api.post<{ category: Category }>('/categories', input).then((r) => r.category);

export const updateCategory = (
  id: string,
  input: { name?: string; status?: 'active' | 'inactive'; sortOrder?: number },
) => api.patch<{ category: Category }>(`/categories/${id}`, input).then((r) => r.category);
