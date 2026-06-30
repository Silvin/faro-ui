import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faro',
  description: 'Administración de cafeterías + punto de venta',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
