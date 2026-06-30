'use client';

import { useUser } from '@/lib/user-context';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const user = useUser();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Hola, {user.name}</h1>
      <Card>
        <p className="text-muted">
          Bienvenido a Faro.{' '}
          {user.isSuperAdmin
            ? 'Eres super admin global: crea negocios desde “Nuevo negocio”.'
            : 'Gestiona tu cafetería desde el menú lateral.'}
        </p>
      </Card>
    </div>
  );
}
