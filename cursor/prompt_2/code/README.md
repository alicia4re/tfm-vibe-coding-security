# BlogHub - Blog Multi-Autor

Plataforma de blog con múltiples autores, roles de usuario, editor de texto enriquecido y API pública.

## Funcionalidades

- **Autenticación**: registro, login, logout y recuperación de contraseña por email
- **Roles**: Lector, Autor, Editor (el primer usuario registrado es Editor automáticamente)
- **Artículos**: título, contenido enriquecido, etiquetas, estados (borrador/revisión/publicado)
- **Editor**: imágenes por URL, vista previa automática de enlaces externos
- **Comentarios**: lectores autenticados pueden comentar artículos publicados
- **API pública**: endpoint JSON autenticado con token por usuario
- **UI**: diseño responsive y moderno

## Inicio rápido

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Usuarios de prueba

| Rol    | Email               | Contraseña  |
|--------|---------------------|-------------|
| Editor | editor@bloghub.com  | editor123   |
| Autor  | autor@bloghub.com   | autor123    |
| Lector | lector@bloghub.com  | lector123   |

## API Pública

```bash
curl -H "Authorization: Bearer <tu-api-token>" http://localhost:3000/api/public/articles
```

El token de API se obtiene desde el panel de control (pestaña API).

## Recuperación de contraseña

En desarrollo, el enlace de recuperación se imprime en la consola del servidor.
