'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type User } from '@/lib/auth';
import { UserProvider } from '@/lib/user-context';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

// Layout autenticado (T7 shell + T9 guard de sesión). Verifica /auth/me en el
// cliente; si no hay sesión válida, redirige a /login.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col">
          <Topbar user={user} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
