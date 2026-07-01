'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { getSalesReport, type SalesReport } from '@/lib/reports';
import { toPesos } from '@/lib/products';
import { ApiError } from '@/lib/api';
import { Card } from '@/components/ui/Card';

type Range = 'today' | 'yesterday';

function rangeFor(r: Range) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (r === 'yesterday') start.setDate(start.getDate() - 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function ReportsPage() {
  const me = useUser();
  const [range, setRange] = useState<Range>('today');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeFor(r);
      setReport(await getSalesReport({ from, to, tz: new Date().getTimezoneOffset() }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!me.isSuperAdmin) void load(range);
  }, [me.isSuperAdmin, range, load]);

  if (me.isSuperAdmin) {
    return (
      <Card>
        <p className="text-muted">Los reportes son por negocio.</p>
      </Card>
    );
  }

  const rangeBtn = (a: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${a ? 'bg-accent text-ink' : 'bg-bg text-muted'}`;
  const maxCat = Math.max(1, ...(report?.byCategory.map((c) => c.totalCents) ?? [1]));
  const maxHour = Math.max(1, ...(report?.byHour.map((h) => h.totalCents) ?? [1]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Reportes</h1>
        <div className="flex gap-2">
          <button className={rangeBtn(range === 'today')} onClick={() => setRange('today')}>
            Hoy
          </button>
          <button className={rangeBtn(range === 'yesterday')} onClick={() => setRange('yesterday')}>
            Ayer
          </button>
        </div>
      </div>

      {error && (
        <Card>
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}
      {loading && (
        <Card>
          <p className="text-muted">Cargando…</p>
        </Card>
      )}

      {report && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-muted">Total vendido</p>
              <p className="text-4xl font-bold text-ink">${toPesos(report.totalCents)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Ventas</p>
              <p className="text-4xl font-bold text-ink">{report.salesCount}</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Por forma de pago</h2>
            {report.byPaymentMethod.length === 0 ? (
              <p className="text-sm text-muted">Sin ventas en el rango.</p>
            ) : (
              <ul className="space-y-1">
                {report.byPaymentMethod.map((p) => (
                  <li key={p.method} className="flex justify-between text-sm">
                    <span className="text-ink">
                      {p.method === 'card' ? 'Tarjeta' : 'Efectivo'} <span className="text-muted">· {p.count}</span>
                    </span>
                    <span className="font-medium text-ink">${toPesos(p.totalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Por categoría</h2>
            {report.byCategory.length === 0 ? (
              <p className="text-sm text-muted">Sin ventas en el rango.</p>
            ) : (
              <ul className="space-y-2">
                {report.byCategory.map((c) => (
                  <li key={c.categoryName}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink">
                        {c.categoryName} <span className="text-muted">· {c.quantity} u</span>
                      </span>
                      <span className="font-medium text-ink">${toPesos(c.totalCents)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-bg">
                      <div className="h-2 rounded bg-accent" style={{ width: `${(c.totalCents / maxCat) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Por horario</h2>
            {report.byHour.length === 0 ? (
              <p className="text-sm text-muted">Sin ventas en el rango.</p>
            ) : (
              <ul className="space-y-1">
                {report.byHour.map((h) => (
                  <li key={h.hour} className="flex items-center gap-2 text-xs">
                    <span className="w-12 shrink-0 text-muted">{String(h.hour).padStart(2, '0')}:00</span>
                    <div className="h-3 flex-1 rounded bg-bg">
                      <div className="h-3 rounded bg-accent" style={{ width: `${(h.totalCents / maxHour) * 100}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-ink">${toPesos(h.totalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
