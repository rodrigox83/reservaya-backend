# Reservaya - Backend

API REST para el sistema de reservas de parrillas.

## Tecnologías

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT para autenticación

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o pnpm

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales de PostgreSQL:

```
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/reservaya
JWT_SECRET=tu-secret-seguro
```

3. Crea la base de datos y ejecuta las migraciones:

```bash
npm run db:generate
npm run db:migrate
```

4. (Opcional) Ejecuta el seed para crear las parrillas:

```bash
npm run db:seed
```

## Desarrollo

```bash
npm run dev
```

El servidor estará en `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Grills
- `GET /api/grills` - Listar parrillas
- `GET /api/grills/:id` - Obtener parrilla
- `GET /api/grills/:id/availability?date=` - Verificar disponibilidad

### Reservations
- `GET /api/reservations` - Listar reservas
- `GET /api/reservations/user/:userId` - Reservas por usuario
- `GET /api/reservations/grill/:grillId` - Reservas por parrilla
- `POST /api/reservations` - Crear reserva
- `PATCH /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Cancelar reserva
- `PATCH /api/reservations/:id/approve` - Aprobar reserva
- `PATCH /api/reservations/:id/reject` - Rechazar reserva

## Frontend

Este backend está diseñado para funcionar con reservaya-frontend.
