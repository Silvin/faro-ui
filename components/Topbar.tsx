'use client';

import { useRouter } from 'next/navigation';
import { logout, type User } from '@/lib/auth';
import { Button } from './ui/Button';

export function Topbar({ user, onMenu }: { user: User; onMenu?: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        {/* Hamburguesa: solo en móvil */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-ink hover:bg-bg md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm text-muted">
          {user.isSuperAdmin ? 'Super admin global' : 'Mi negocio'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink sm:inline">{user.name}</span>
        <Button variant="ghost" onClick={handleLogout}>
          Salir
        </Button>
      </div>
    </header>
  );
}
