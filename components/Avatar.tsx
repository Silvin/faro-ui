import { imageSrc } from '@/lib/uploads';

function initials(name: string): string {
  return name.trim().slice(0, 3).toUpperCase();
}

// Color de fondo estable derivado del nombre (placeholder cuando no hay imagen).
function bgFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 55% 85%)`;
}

export function Avatar({
  name,
  imageUrl,
  className = '',
  initialsClass = 'text-xs',
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  initialsClass?: string;
}) {
  const src = imageSrc(imageUrl ?? undefined);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: bgFor(name) }}>
      <span className={`font-bold text-ink ${initialsClass}`}>{initials(name)}</span>
    </div>
  );
}
