'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { listProducts, createProduct, updateProduct, toPesos, toCents, type Product } from '@/lib/products';
import { listCategories, type Category } from '@/lib/categories';
import { ApiError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

const selectClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent-strong';

export default function ProductsPage() {
  const me = useUser();
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', categoryId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', price: '', categoryId: '' });

  async function refresh() {
    try {
      const [p, c] = await Promise.all([listProducts(), listCategories()]);
      setItems(p);
      setCats(c);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : 'Error al cargar');
    }
  }

  useEffect(() => {
    if (!me.isSuperAdmin) void refresh();
  }, [me.isSuperAdmin]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormErr(null);
    try {
      await createProduct({ name: form.name, priceCents: toCents(form.price), categoryId: form.categoryId || null });
      setForm({ name: '', price: '', categoryId: '' });
      await refresh();
    } catch (err) {
      setFormErr(err instanceof ApiError ? err.message : 'Error al crear producto');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(p: Product) {
    try {
      await updateProduct(p.id, { status: p.status === 'active' ? 'inactive' : 'active' });
      await refresh();
    } catch {
      /* noop */
    }
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setEdit({ name: p.name, price: toPesos(p.priceCents), categoryId: p.categoryId ?? '' });
  }

  async function saveEdit(p: Product) {
    try {
      await updateProduct(p.id, {
        name: edit.name,
        priceCents: toCents(edit.price),
        categoryId: edit.categoryId || null,
      });
      setEditId(null);
      await refresh();
    } catch {
      /* noop */
    }
  }

  if (me.isSuperAdmin) {
    return (
      <Card>
        <p className="text-muted">Los productos se gestionan por negocio.</p>
      </Card>
    );
  }

  const activeCats = cats.filter((c) => c.status === 'active');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ink">Productos</h2>
        {loadErr && <p className="text-sm text-danger">{loadErr}</p>}
        <ul className="divide-y divide-line">
          {items.map((p) =>
            editId === p.id ? (
              <li key={p.id} className="space-y-2 py-3">
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Nombre" />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={edit.price}
                    onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                    placeholder="Precio"
                  />
                  <select
                    className={selectClass}
                    value={edit.categoryId}
                    onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}
                  >
                    <option value="">Sin categoría</option>
                    {activeCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit(p)}>Guardar</Button>
                  <Button variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </div>
              </li>
            ) : (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    {p.name}
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.status === 'active' ? 'bg-accent text-ink' : 'bg-bg text-muted'
                      }`}
                    >
                      {p.status}
                    </span>
                  </span>
                  <span className="text-xs text-muted">
                    ${toPesos(p.priceCents)} · {p.categoryName ?? 'sin categoría'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" onClick={() => startEdit(p)}>
                    Editar
                  </Button>
                  <Button variant="outline" onClick={() => toggleStatus(p)}>
                    {p.status === 'active' ? 'Desactivar' : 'Activar'}
                  </Button>
                </span>
              </li>
            ),
          )}
          {items.length === 0 && !loadErr && <li className="py-2 text-sm text-muted">Sin productos todavía.</li>}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ink">Nuevo producto</h2>
        <form onSubmit={onCreate} className="space-y-3">
          <FormField label="Nombre" htmlFor="name">
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Precio" htmlFor="price">
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Categoría" htmlFor="categoryId">
            <select
              id="categoryId"
              className={selectClass}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {activeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          {formErr && <p className="text-sm text-danger">{formErr}</p>}
          <Button type="submit" loading={submitting} className="w-full">
            Crear producto
          </Button>
        </form>
      </Card>
    </div>
  );
}
