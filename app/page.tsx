'use client';

import { useEffect, useState } from 'react';
import { apiGet, API_URL } from '@/lib/api';

export default function Home() {
  const [status, setStatus] = useState('comprobando…');

  useEffect(() => {
    apiGet<{ status: string }>('/health')
      .then((d) => setStatus(`API: ${d.status}`))
      .catch(() => setStatus('API no disponible'));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-lg border border-line bg-surface p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Faro UI</h1>
        <p className="mt-1 text-muted">Frontend (faro-ui) → backend por HTTP</p>
        <span className="mt-4 inline-block rounded-md bg-accent px-4 py-2 font-medium text-ink">
          {status}
        </span>
        <p className="mt-3 text-xs text-muted">{API_URL}</p>
      </div>
    </main>
  );
}
