# Multiblog

Blog colaborativo con varios autores, construido con Next.js 16 (App Router), TypeScript, Prisma + SQLite, autenticación propia (JWT en cookie httpOnly), Tiptap para el editor de texto enriquecido y Tailwind CSS.

## Puesta en marcha

```bash
npm install
npx prisma migrate deploy   # crea la base de datos SQLite
npx prisma db seed          # datos de ejemplo (usuarios y artículos)
npm run dev
```

Abre http://localhost:3000

## Usuarios de prueba (contraseña `password123` para todos)

| Rol    | Email               |
|--------|---------------------|
| Editor | editor@blog.test    |
| Autor  | autor@blog.test     |
| Autor  | autora2@blog.test   |
| Lector | lector@blog.test    |

El primer usuario que se registre desde `/registro` en una base de datos vacía se convierte automáticamente en **editor**.

## Notas de la implementación

- **Roles**: lector, autor y editor, con visibilidad de artículos (borrador/revisión) restringida al autor y a los editores.
- **Emails**: no hay proveedor SMTP configurado; los correos (recuperación de contraseña) se guardan en base de datos y se consultan en `/buzon`.
- **API pública**: `GET /api/public/articles`, autenticada con `Authorization: Bearer <token>` (token visible en `/perfil`). Admite `?q=`, `?page=`, `?pageSize=`.
- **Vista previa de enlaces**: botón 🌐 en el editor, obtiene título/imagen vía Open Graph desde el servidor (`/api/link-preview`).
- **Base de datos**: SQLite en `prisma/dev.db`, pensada para desarrollo/demo local.
