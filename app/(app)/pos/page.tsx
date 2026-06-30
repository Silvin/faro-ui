'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { listProducts, toPesos, toCents, type Product } from '@/lib/products';
import { createSale, listSales, getSale, type Sale } from '@/lib/sales';
import { ApiError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type CartLine = { product: Product; qty: number };

export default function PosPage() {
  const me = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [paid, setPaid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<Sale | null>(null);
  const [recent, setRecent] = useState<Sale[] | null>(null);

  useEffect(() => {
    if (!me.isSuperAdmin) {
      listProducts()
        .then((p) => setProducts(p.filter((x) => x.status === 'active')))
        .catch(() => setError('No se pudieron cargar los productos'));
    }
  }, [me.isSuperAdmin]);

  const lines = Object.values(cart);
  const totalCents = useMemo(() => lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0), [cart]); // eslint-disable-line react-hooks/exhaustive-deps
  const paidCents = toCents(paid);
  const changeCents = paidCents - totalCents;

  function add(p: Product) {
    setCart((c) => ({ ...c, [p.id]: { product: p, qty: (c[p.id]?.qty ?? 0) + 1 } }));
  }
  function setQty(id: string, qty: number) {
    setCart((c) => {
      if (qty <= 0) {
        const { [id]: _removed, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }
  function clearSale() {
    setCart({});
    setPaid('');
    setError(null);
  }

  async function charge() {
    setSubmitting(true);
    setError(null);
    try {
      const sale = await createSale(
        lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        paidCents,
      );
      setTicket(sale);
      clearSale();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'insufficient_payment') setError('El monto recibido es menor al total.');
      else setError(e instanceof ApiError ? e.message : 'No se pudo cobrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function openRecent() {
    try {
      setRecent(await listSales());
    } catch {
      /* noop */
    }
  }
  async function openTicket(id: string) {
    try {
      setTicket(await getSale(id));
      setRecent(null);
    } catch {
      /* noop */
    }
  }

  if (me.isSuperAdmin) {
    return (
      <Card>
        <p className="text-muted">El punto de venta es por negocio.</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Punto de venta</h1>
        <Button variant="outline" onClick={openRecent}>
          Ventas recientes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Catálogo */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink">Productos</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted">No hay productos activos. Crea productos primero.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className="rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-accent-strong"
                >
                  <div className="text-sm font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-muted">${toPesos(p.priceCents)}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Carrito / cobro */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink">Venta</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-muted">Agrega productos del catálogo…</p>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{l.product.name}</span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => setQty(l.product.id, l.qty - 1)} className="rounded bg-bg px-2 text-ink">
                      −
                    </button>
                    <span className="w-4 text-center">{l.qty}</span>
                    <button onClick={() => setQty(l.product.id, l.qty + 1)} className="rounded bg-accent px-2 text-ink">
                      +
                    </button>
                    <span className="w-16 text-right text-muted">${toPesos(l.product.priceCents * l.qty)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-ink">
            <span>Total</span>
            <span>${toPesos(totalCents)}</span>
          </div>

          <div className="mt-3 space-y-1">
            <label htmlFor="paid" className="block text-sm font-medium text-ink">
              Monto recibido
            </label>
            <Input id="paid" type="number" step="0.01" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} />
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-muted">Cambio</span>
              <span className={changeCents >= 0 ? 'text-success' : 'text-danger'}>
                {changeCents >= 0 ? `$${toPesos(changeCents)}` : `Falta $${toPesos(-changeCents)}`}
              </span>
            </div>
          </div>

          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <Button
            className="mt-4 w-full"
            loading={submitting}
            disabled={lines.length === 0 || paidCents < totalCents}
            onClick={charge}
          >
            Cobrar
          </Button>
        </Card>
      </div>

      {ticket && <TicketModal sale={ticket} cashier={me.name} onClose={() => setTicket(null)} />}
      {recent && <RecentModal sales={recent} onOpen={openTicket} onClose={() => setRecent(null)} />}
    </div>
  );
}

function TicketModal({ sale, cashier, onClose }: { sale: Sale; cashier: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="no-print absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xs rounded-lg bg-surface p-5 shadow-lg">
        <div className="ticket-print text-sm text-ink">
          <div className="text-center">
            <div className="text-lg font-bold">Faro</div>
            <div className="text-xs text-muted">Ticket de venta</div>
            <div className="text-xs text-muted">{new Date(sale.createdAt).toLocaleString()}</div>
            <div className="text-xs text-muted">Cajero: {cashier}</div>
          </div>
          <hr className="my-2 border-line" />
          <ul>
            {(sale.items ?? []).map((it) => (
              <li key={it.id} className="flex justify-between">
                <span className="truncate">
                  {it.quantity}× {it.name}
                </span>
                <span>${toPesos(it.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <hr className="my-2 border-line" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${toPesos(sale.totalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Recibido</span>
            <span>${toPesos(sale.amountPaidCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cambio</span>
            <span>${toPesos(sale.changeCents)}</span>
          </div>
          <div className="mt-3 text-center text-xs text-muted">¡Gracias por su compra!</div>
        </div>
        <div className="no-print mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecentModal({ sales, onOpen, onClose }: { sales: Sale[]; onOpen: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-lg bg-surface p-5 shadow-lg">
        <h3 className="mb-3 text-lg font-semibold text-ink">Ventas recientes</h3>
        {sales.length === 0 ? (
          <p className="text-sm text-muted">Sin ventas todavía.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-line overflow-auto">
            {sales.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onOpen(s.id)}
                  className="flex w-full items-center justify-between py-2 text-sm hover:text-accent-strong"
                >
                  <span className="text-muted">{new Date(s.createdAt).toLocaleTimeString()}</span>
                  <span className="font-medium text-ink">${toPesos(s.totalCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
