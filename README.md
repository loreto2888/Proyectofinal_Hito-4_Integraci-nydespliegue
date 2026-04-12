# Proyecto Final – Hito 4: Integración y despliegue

Esta carpeta contiene la versión integrada del proyecto Marketplace para el Hito 4.

## PostgreSQL local con Docker Compose

1. Levantar la base de datos desde la raíz del proyecto con `docker compose up -d`.
2. El contenedor expondrá PostgreSQL en `localhost:5432`.
3. El esquema inicial se carga automáticamente desde `backend/script.sql` la primera vez que se crea el volumen.
4. Copiar `backend/.env.example` a `backend/.env` para que el backend use esas mismas credenciales.

Si necesitas reinicializar completamente la base de datos, elimina el volumen y vuelve a levantar el servicio con `docker compose down -v` y luego `docker compose up -d`.

## Estructura

- frontend/ → Aplicación cliente en React + Vite.
- backend/ → API REST en Node.js + Express + PostgreSQL.
- docs/ → Documentación específica del Hito 4.

## Ejecución en desarrollo

### Backend

1. Entrar en la carpeta `backend/`.
2. Copiar `.env.example` a `.env` y ajustar credenciales de PostgreSQL y `JWT_SECRET`.
3. Si usas Docker Compose, levantar PostgreSQL desde la raíz con `docker compose up -d`.
4. Si no usas Docker Compose, crear la base de datos local y ejecutar `script.sql` manualmente.
5. Instalar dependencias: `npm install`.
6. Levantar la API: `npm run dev` (escucha por defecto en el puerto 4000).

### Frontend

1. Entrar en la carpeta `frontend/`.
2. Instalar dependencias: `npm install`.
3. (Opcional) Crear un archivo `.env` con `VITE_API_BASE_URL=http://localhost:4000/api`.
4. Levantar el entorno de desarrollo: `npm run dev`.

## Despliegue

Los pasos detallados de deploy de la base de datos, backend y frontend, y la integración mediante variables de entorno se describen en:

- docs/Hito4_Documentacion.md

Allí se indica qué variables de entorno configurar en los servicios de la nube y cómo verificar la persistencia de datos desde la app cliente hasta la base de datos en producción.
