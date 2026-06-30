'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { listProducts, toPesos, toCents, type Product } from '@/lib/products';
import { listCategories, type Category } from '@/lib/categories';
import { imageSrc } from '@/lib/uploads';
import { createSale, listSales, getSale, type Sale, type PaymentMethod } from '@/lib/sales';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type CartLine = { product: Product; qty: number };

export default function PosPage() {
  const me = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paid, setPaid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<Sale | null>(null);
  const [recent, setRecent] = useState<Sale[] | null>(null);
  const [qtyModal, setQtyModal] = useState<{ product: Product; qty: number } | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);

  useEffect(() => {
    if (!me.isSuperAdmin) {
      listProducts()
        .then((p) => setProducts(p.filter((x) => x.status === 'active')))
        .catch(() => setError('No se pudieron cargar los productos'));
      listCategories()
        .then((c) => setCats(c.filter((x) => x.status === 'active')))
        .catch(() => {});
    }
  }, [me.isSuperAdmin]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) => (activeCat === 'all' || p.categoryId === activeCat) && (q === '' || p.name.toLowerCase().includes(q)),
    );
  }, [products, activeCat, search]);

  const lines = Object.values(cart);
  const totalCents = useMemo(() => lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0), [cart]); // eslint-disable-line react-hooks/exhaustive-deps
  const paidCents = toCents(paid);
  const changeCents = paidCents - totalCents;

  function openQty(p: Product) {
    setQtyModal({ product: p, qty: cart[p.id]?.qty ?? 1 });
  }
  function confirmQty(qty: number) {
    if (!qtyModal) return;
    const p = qtyModal.product;
    setCart((c) => ({ ...c, [p.id]: { product: p, qty } }));
    setQtyModal(null);
  }
  function removeLine(p: Product) {
    setCart((c) => {
      const { [p.id]: _removed, ...rest } = c;
      return rest;
    });
    setConfirmDel(null);
  }
  function clearSale() {
    setCart({});
    setPaid('');
    setError(null);
    setMethod('cash');
  }

  const canCharge = lines.length > 0 && (method === 'card' || paidCents >= totalCents);

  async function charge() {
    setSubmitting(true);
    setError(null);
    try {
      const sale = await createSale(
        lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        method,
        method === 'card' ? 0 : paidCents,
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
    return <div className="p-6 text-muted">El punto de venta es por negocio.</div>;
  }

  const railItem = (a: boolean) =>
    `rounded-lg px-3 py-2 text-left text-sm font-medium ${a ? 'bg-accent text-ink' : 'text-muted hover:bg-bg hover:text-ink'}`;
  const tabItem = (a: boolean) =>
    `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${a ? 'bg-accent text-ink' : 'bg-bg text-muted'}`;
  const payBtn = (a: boolean) =>
    `rounded-lg border p-4 text-center text-base font-semibold transition-colors ${
      a ? 'border-accent-strong bg-accent text-ink' : 'border-line bg-surface text-muted hover:text-ink'
    }`;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <div className="text-xl font-bold text-ink">
          Faro<span className="text-accent-strong">.</span>{' '}
          <span className="text-sm font-normal text-muted">Punto de venta</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openRecent}>
            Ventas recientes
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ☰ Menú
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Categorías (rail, md+) */}
        <nav className="hidden w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-surface p-3 md:flex">
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted">Categorías</p>
          <button className={railItem(activeCat === 'all')} onClick={() => setActiveCat('all')}>
            Todas
          </button>
          {cats.map((c) => (
            <button key={c.id} className={railItem(activeCat === c.id)} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </button>
          ))}
        </nav>

        {/* Productos */}
        <section className="flex flex-1 flex-col overflow-hidden p-4">
          <Input
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="mb-3 flex gap-2 overflow-x-auto md:hidden">
            <button className={tabItem(activeCat === 'all')} onClick={() => setActiveCat('all')}>
              Todas
            </button>
            {cats.map((c) => (
              <button key={c.id} className={tabItem(activeCat === c.id)} onClick={() => setActiveCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const src = imageSrc(p.imageUrl);
              return (
                <button
                  key={p.id}
                  onClick={() => openQty(p)}
                  className="overflow-hidden rounded-md border border-line bg-surface text-left transition-colors hover:border-accent-strong"
                >
                  <div className="flex h-20 w-full items-center justify-center bg-bg text-xs text-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      'Sin foto'
                    )}
                  </div>
                  <div className="p-2">
                    <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                    <div className="text-xs text-muted">${toPesos(p.priceCents)}</div>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && <p className="text-sm text-muted">No hay productos.</p>}
          </div>
        </section>

        {/* Carrito / cobro */}
        <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-line bg-surface p-4 md:w-96 md:border-l md:border-t-0">
          <h2 className="mb-3 text-lg font-semibold text-ink">Venta</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-muted">Toca un producto para agregarlo…</p>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{l.product.name}</span>
                    <span className="text-xs text-muted">
                      {l.qty} × ${toPesos(l.product.priceCents)} = ${toPesos(l.product.priceCents * l.qty)}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button variant="ghost" onClick={() => openQty(l.product)}>
                      Editar
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmDel(l.product)}>
                      Eliminar
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-ink">
            <span>Total</span>
            <span>${toPesos(totalCents)}</span>
          </div>

          <p className="mb-2 mt-4 text-sm font-medium text-ink">Forma de pago</p>
          <div className="grid grid-cols-2 gap-2">
            <button className={payBtn(method === 'cash')} onClick={() => setMethod('cash')}>
              💵 Efectivo
            </button>
            <button className={payBtn(method === 'card')} onClick={() => setMethod('card')}>
              💳 Tarjeta
            </button>
          </div>

          {method === 'cash' && (
            <div className="mt-3 space-y-2">
              <label htmlFor="paid" className="block text-sm font-medium text-ink">
                Monto recibido
              </label>
              <Input id="paid" type="number" step="0.01" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} />
              <div className="rounded-lg bg-bg p-4 text-center">
                <div className="text-sm text-muted">Cambio</div>
                <div className={`text-4xl font-bold ${changeCents >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${toPesos(Math.abs(changeCents))}
                </div>
                {changeCents < 0 && <div className="text-sm text-danger">Falta para completar el pago</div>}
              </div>
            </div>
          )}
          {method === 'card' && (
            <p className="mt-3 rounded-lg bg-bg p-4 text-center text-sm text-muted">
              Se cobrará <span className="font-semibold text-ink">${toPesos(totalCents)}</span> con tarjeta.
            </p>
          )}

          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <Button className="mt-4 w-full" loading={submitting} disabled={!canCharge} onClick={charge}>
            Cobrar
          </Button>
        </aside>
      </div>

      {qtyModal && (
        <QuantityModal
          product={qtyModal.product}
          initial={qtyModal.qty}
          onConfirm={confirmQty}
          onCancel={() => setQtyModal(null)}
        />
      )}
      {confirmDel && (
        <ConfirmModal name={confirmDel.name} onConfirm={() => removeLine(confirmDel)} onCancel={() => setConfirmDel(null)} />
      )}
      {ticket && <TicketModal sale={ticket} cashier={me.name} onClose={() => setTicket(null)} />}
      {recent && <RecentModal sales={recent} onOpen={openTicket} onClose={() => setRecent(null)} />}
    </div>
  );
}

function QuantityModal({
  product,
  initial,
  onConfirm,
  onCancel,
}: {
  product: Product;
  initial: number;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(Math.max(1, initial));
  const src = imageSrc(product.imageUrl);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-xs rounded-lg bg-surface p-5 text-center shadow-lg">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-line bg-bg text-xs text-muted">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            'Sin foto'
          )}
        </div>
        <h3 className="text-lg font-semibold text-ink">{product.name}</h3>
        <p className="text-sm text-muted">${toPesos(product.priceCents)} c/u</p>

        <div className="my-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-12 w-12 rounded-lg bg-bg text-2xl text-ink"
          >
            −
          </button>
          <span className="w-12 text-3xl font-bold text-ink">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="h-12 w-12 rounded-lg bg-accent text-2xl text-ink">
            +
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Subtotal: <span className="font-semibold text-ink">${toPesos(product.priceCents * qty)}</span>
        </p>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => onConfirm(qty)}>
            Agregar
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-xs rounded-lg bg-surface p-5 shadow-lg">
        <p className="text-sm text-ink">
          ¿Eliminar <span className="font-semibold">{name}</span> de la venta?
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Eliminar
          </button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
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
            <span>Pago</span>
            <span>{sale.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}</span>
          </div>
          {sale.paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span>Recibido</span>
                <span>${toPesos(sale.amountPaidCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cambio</span>
                <span>${toPesos(sale.changeCents)}</span>
              </div>
            </>
          )}
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
                  <span className="text-muted">
                    {new Date(s.createdAt).toLocaleTimeString()} · {s.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                  </span>
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
