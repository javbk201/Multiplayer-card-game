# Card Game Multiplayer

Un juego de cartas multijugador construido con una arquitectura moderna de microservicios.

## Arquitectura

- **Frontend**: React + Phaser 3 + Zustand
- **Backend**: Go + WebSockets nativos
- **Base de datos**: PostgreSQL
- **Comunicación**: WebSockets para tiempo real, eventos globales con Zustand

## Estructura del proyecto

```
card-game-multiplayer/
├── frontend/          # React + Phaser 3 + Zustand
├── backend/           # Go + WebSockets
├── database/          # PostgreSQL schemas y migrations
├── docs/              # Documentación
├── docker-compose.yml # PostgreSQL setup
└── package.json       # Scripts del monorepo
```

## Desarrollo

### Prerequisitos

- Node.js 18+
- Go 1.21+
- Docker (para PostgreSQL)

### Configuración inicial

1. Instalar dependencias:
```bash
npm run install:all
```

2. Levantar la base de datos:
```bash
npm run docker:up
```

3. Ejecutar en modo desarrollo:
```bash
npm run start:dev
```

### URLs de desarrollo

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Adminer (DB): http://localhost:8080

## Scripts disponibles

- `npm run dev:frontend` - Ejecutar frontend en desarrollo
- `npm run dev:backend` - Ejecutar backend en desarrollo
- `npm run start:dev` - Ejecutar ambos concurrentemente
- `npm run build:frontend` - Construir frontend para producción
- `npm run build:backend` - Construir backend para producción
- `npm run docker:up` - Levantar PostgreSQL
- `npm run docker:down` - Detener PostgreSQL