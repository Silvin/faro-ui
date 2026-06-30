import { api } from './api';

export type User = {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  status: string;
  createdAt: string;
};

export const getMe = () => api.get<{ user: User }>('/auth/me').then((r) => r.user);

export const login = (email: string, password: string) =>
  api.post<{ user: User }>('/auth/login', { email, password }).then((r) => r.user);

export const logout = () => api.post<void>('/auth/logout', {});

export const listUsers = () => api.get<{ items: User[] }>('/users').then((r) => r.items);

export const createUser = (input: { email: string; password: string; name: string }) =>
  api.post<{ user: User }>('/users', input);

export const createTenant = (input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}) => api.post('/tenants', input);
