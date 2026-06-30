'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type User } from '@/lib/auth';
import { UserProvider } from '@/lib/user-context';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

// Layout autenticado (T7 shell + T9 guard). Responsivo: sidebar fijo en desktop,
// drawer con overlay en móvil.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  return (
    <UserProvider value={user}>
      <div className="flex min-h-screen">
        {/* Sidebar fijo (desktop) */}
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>

        {/* Drawer (móvil) */}
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
