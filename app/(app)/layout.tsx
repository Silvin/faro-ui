'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe, type User } from '@/lib/auth';
import { UserProvider } from '@/lib/user-context';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

// Layout autenticado (T7 shell + T9 guard). El POS (/pos) se muestra a pantalla
// completa, sin el menú lateral (es la pantalla de operación por horas).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Cargando…</div>;
  }
  if (!user) return null;

  // Vista a pantalla completa (sin sidebar) para el punto de venta.
  if (pathname === '/pos') {
    return <UserProvider value={user}>{children}</UserProvider>;
  }

  return (
    <UserProvider value={user}>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-hidden />
            <div className="absolute left-0 top-0 h-full shadow-lg">
              <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
