import { API_URL } from './api';

// Sube una imagen al backend y devuelve su URL relativa (ej. /files/abc.jpg).
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  if (!res.ok) {
    let msg = 'No se pudo subir la imagen';
    try {
      const b = await res.json();
      if (b.message) msg = b.message;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

// imageSrc construye la URL completa para mostrar una imagen guardada.
export function imageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
