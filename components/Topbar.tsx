'use client';

import { useRouter } from 'next/navigation';
import { logout, type User } from '@/lib/auth';
import { Button } from './ui/Button';

export function Topbar({ user }: { user: User }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <span className="text-sm text-muted">
        {user.isSuperAdmin ? 'Super admin global' : 'Mi negocio'}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink">{user.name}</span>
        <Button variant="ghost" onClick={handleLogout}>
          Salir
        </Button>
      </div>
    </header>
  );
}
