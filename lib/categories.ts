import { api } from './api';

export type Category = {
  id: string;
  tenantId: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  imageUrl: string | null;
  createdAt: string;
};

type CategoryInput = {
  name?: string;
  sortOrder?: number;
  imageUrl?: string | null;
  status?: 'active' | 'inactive';
};

export const listCategories = () =>
  api.get<{ items: Category[] }>('/categories').then((r) => r.items);

export const getCategory = (id: string) =>
  api.get<{ category: Category }>(`/categories/${id}`).then((r) => r.category);

export const createCategory = (input: CategoryInput) =>
  api.post<{ category: Category }>('/categories', input).then((r) => r.category);

export const updateCategory = (id: string, input: CategoryInput) =>
  api.patch<{ category: Category }>(`/categories/${id}`, input).then((r) => r.category);
