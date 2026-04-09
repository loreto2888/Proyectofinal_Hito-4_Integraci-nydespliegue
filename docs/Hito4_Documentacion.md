# Hito 4 – Integración y despliegue

## 1. Descripción general

Este hito integra el frontend (React + Vite), el backend (Node.js + Express) y la base de datos PostgreSQL en un entorno de producción desplegado en la nube.

Estructura del proyecto en esta carpeta:

- frontend/ → Aplicación cliente (React + Vite).
- backend/ → API REST (Express + PostgreSQL).
- docs/ → Documentación del hito 4.

## 2. Deploy de la base de datos

1. Crear una base de datos PostgreSQL en un proveedor en la nube (Render PostgreSQL, Railway, Neon, Supabase, etc.).
2. Obtener las credenciales o cadena `DATABASE_URL` del servicio.
3. Ejecutar el script de creación de tablas usando el archivo:
   - backend/script.sql
4. Verificar que se crearon las tablas `users`, `posts`, `post_images` y `favorites`.

## 3. Deploy del backend

1. Subir la carpeta `backend/` a un repositorio (por ejemplo GitHub).
2. Crear un servicio web en la nube (por ejemplo Render) con las siguientes características:
   - Runtime: Node.js
   - Comando de build: `npm install`
   - Comando de start: `node src/index.js`
3. Configurar las variables de entorno en el servicio:
   - Usando `DATABASE_URL` **o** los campos separados:
     - `PGHOST`
     - `PGPORT`
     - `PGUSER`
     - `PGPASSWORD`
     - `PGDATABASE`
   - Configurar también:
     - `JWT_SECRET` (secreto para firmar tokens JWT).
4. Desplegar y anotar la URL pública del backend, por ejemplo:
   - `https://mi-backend.onrender.com`
5. Probar desde el navegador o herramienta tipo Thunder Client:
   - `GET /` → debe responder un JSON con `{ "message": "Marketplace API Hito 4" }`.
   - `GET /api/posts` → debe devolver listado de publicaciones (vacío o con datos según la BD).

## 4. Deploy del frontend

1. Subir la carpeta `frontend/` a un repositorio (por ejemplo GitHub).
2. Crear un sitio estático en un proveedor como Netlify o Vercel:
   - Comando de build: `npm run build`
   - Directorio de publicación: `dist`
3. Configurar en el panel del proveedor la variable de entorno que apunta al backend en producción:
   - `VITE_API_BASE_URL=https://mi-backend.onrender.com/api`
4. Desplegar y anotar la URL pública del frontend, por ejemplo:
   - `https://mi-frontend.netlify.app`

## 5. Integración cliente–servidor en producción

La integración se realiza mediante la variable de entorno `VITE_API_BASE_URL` que utiliza el frontend.

- En desarrollo, los servicios usan por defecto: `http://localhost:4000/api`.
- En producción, el valor de `VITE_API_BASE_URL` se define en el proveedor del frontend.

Archivos clave del frontend:

- frontend/src/services/authService.js
- frontend/src/services/postsService.js

En ambos se define:

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
```

De esta forma:

- En local: si no hay variable de entorno, apunta a `http://localhost:4000/api`.
- En producción: `VITE_API_BASE_URL` apunta al backend desplegado (por ejemplo `https://mi-backend.onrender.com/api`).

## 6. Pruebas de integración y persistencia

1. Desde el frontend en producción:
   - Registrarse como nuevo usuario.
   - Iniciar sesión.
   - Crear nuevas publicaciones.
2. Verificar desde el panel del proveedor de base de datos que se insertan datos en las tablas:
   - `users` (usuarios registrados)
   - `posts` (publicaciones creadas)
   - `favorites` (si se usan favoritos)
3. Asegurarse de que:
   - Las peticiones desde la app cliente al backend devuelven respuestas correctas (2xx).
   - La información se persiste efectivamente en la base de datos en la nube.

## 7. Entrega

Para la entrega del Hito 4 se debe adjuntar:

- URL en producción del frontend (aplicación cliente).
- URL en producción del backend (API REST).
- Evidencia de que la base de datos en la nube está funcionando (capturas de tablas con datos o descripción en la plataforma).
