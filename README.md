# Faro — UI (frontend)

Frontend **Next.js** (App Router, TypeScript, Tailwind) del sistema **Faro**.
Consume el backend (repo [`faro`](https://github.com/Silvin/faro)) por **HTTP**.

> Identidad visual **BrightPOS** (acento lime `#C4E456`). Specs y design-system en el repo `faro` → `.arete/foundations/design-system.md`. Decisión de repos separados: `ADR-004`.

## Stack
Next.js 14 · React 18 · TypeScript · Tailwind. Imagen Docker `standalone`.

## Estructura
```
faro-ui/
├── app/            # App Router (layout, page, globals.css)
├── lib/api.ts      # cliente HTTP del backend (credentials: include)
├── tailwind.config.ts  # paleta BrightPOS
└── Dockerfile
```

## Correr en local
Requisitos: Node 18+. El backend (`faro`) debe estar corriendo en `:8080`.

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev                        # http://localhost:3000
```
La home hace ping a `/health` del backend para verificar la conexión HTTP.

## Rutas
- `/login` — pantalla de login (email + password).
- `/dashboard` — home autenticado (shell BrightPOS).
- `/users` — listar y crear usuarios del negocio.
- `/tenants/new` — crear negocio + dueño (solo super admin global).

## Estado
**Login UI construido (T7–T10):** shell BrightPOS (sidebar + topbar), pantalla de
login con estados, guard de sesión (`/auth/me` + logout) y provisión (usuarios /
negocios). Conectado al backend (`faro`) por HTTP con cookie de sesión.
Build verificado (`npm run build`). Ver `faro/.arete/modules/login/`.
