'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { listCategories, createCategory, updateCategory, type Category } from '@/lib/categories';
import { ApiError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

export default function CategoriesPage() {
  const me = useUser();
  const [items, setItems] = useState<Category[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function refresh() {
    try {
      setItems(await listCategories());
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : 'Error al cargar categorías');
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
      await createCategory({ name });
      setName('');
      await refresh();
    } catch (err) {
      setFormErr(err instanceof ApiError ? err.message : 'Error al crear categoría');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(c: Category) {
    try {
      await updateCategory(c.id, { status: c.status === 'active' ? 'inactive' : 'active' });
      await refresh();
    } catch {
      /* el error de carga se muestra al refrescar */
    }
  }

  async function saveRename(c: Category) {
    try {
      await updateCategory(c.id, { name: editName });
      setEditingId(null);
      await refresh();
    } catch {
      /* noop */
    }
  }

  if (me.isSuperAdmin) {
    return (
      <Card>
        <p className="text-muted">Las categorías se gestionan por negocio. Inicia sesión como usuario de un negocio.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ink">Categorías</h2>
        {loadErr && <p className="text-sm text-danger">{loadErr}</p>}
        <ul className="divide-y divide-line">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              {editingId === c.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Button onClick={() => saveRename(c)}>Guardar</Button>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex items-center gap-2 text-sm text-ink">
                    {c.name}
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        c.status === 'active' ? 'bg-accent text-ink' : 'bg-bg text-muted'
                      }`}
                    >
                      {c.status}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                    >
                      Renombrar
                    </Button>
                    <Button variant="outline" onClick={() => toggleStatus(c)}>
                      {c.status === 'active' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </span>
                </>
              )}
            </li>
          ))}
          {items.length === 0 && !loadErr && (
            <li className="py-2 text-sm text-muted">Sin categorías todavía.</li>
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ink">Nueva categoría</h2>
        <form onSubmit={onCreate} className="space-y-3">
          <FormField label="Nombre" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          {formErr && <p className="text-sm text-danger">{formErr}</p>}
          <Button type="submit" loading={submitting} className="w-full">
            Crear categoría
          </Button>
        </form>
      </Card>
    </div>
  );
}
