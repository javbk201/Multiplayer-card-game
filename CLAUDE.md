# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time multiplayer card game built with modern web technologies:
- **Frontend**: React + TypeScript + Phaser 3 + Zustand + Vite
- **Backend**: Go + native WebSockets + PostgreSQL
- **Development**: Monorepo structure with concurrent development support

## Development Commands

### Setup & Installation
```bash
# Install all dependencies (uses bun for frontend)
make install
# OR
bun run install:all

# Start PostgreSQL database
make docker-up
# OR 
bun run docker:up
```

### Development
```bash
# Start both frontend and backend concurrently
make dev
# OR
bun run start:dev

# Individual services
bun run dev:frontend    # Frontend only (http://localhost:5173)
bun run dev:backend     # Backend only (http://localhost:8000)
```

### Building & Testing
```bash
# Build frontend and backend
make build
# OR
bun run build:frontend && bun run build:backend

# Test and lint frontend
bun run test:frontend
bun run lint:frontend
# OR
make test && make lint
```

### Database Management
```bash
# Reset database (removes all data)
make db-reset

# Database admin interface available at http://localhost:8080
```

## Architecture

### Backend Structure (`backend/`)
- **Entry point**: `cmd/main.go` - HTTP server with WebSocket endpoint at `/ws`
- **Game logic**: `internal/game/manager.go` - Handles game state, player actions, turn management
- **Types**: `internal/game/types.go` - Game entities (Card, Player, Game), WebSocket message types
- **WebSocket hub**: `internal/websocket/hub.go` - Real-time communication, client management, message routing
- **Database**: `internal/database/database.go` - PostgreSQL connection and queries

### Frontend Structure (`frontend/`)
- **Game engine**: Uses Phaser 3 for game rendering (`src/game/scenes/MainScene.ts`)
- **State management**: Zustand store (`src/stores/gameStore.ts`) with WebSocket integration
- **Components**: React components in `src/components/` (GameCanvas, GameUI)
- **Build tool**: Vite with TypeScript

### Game Flow
1. Players connect via WebSocket (`/ws` endpoint)
2. GameManager handles game creation, player joining, turn management
3. WebSocket Hub broadcasts game state changes to all connected clients
4. Frontend renders game state using Phaser 3 and React UI components
5. Player actions flow: Frontend → WebSocket → GameManager → Broadcast to all players

### Key Dependencies
- **Backend**: `gorilla/websocket`, `lib/pq` (PostgreSQL), `google/uuid`
- **Frontend**: `phaser`, `zustand`, `react`, TypeScript toolchain

### WebSocket Message Types
- `join_game`, `leave_game`, `play_card` (client → server)
- `game_state`, `player_joined`, `player_left`, `card_played`, `game_ended`, `error` (server → client)

## Development Notes

- Use `make` commands for common tasks or npm scripts from root package.json
- Frontend uses bun as package manager
- Backend requires Go 1.21+
- Database initialization SQL scripts in `database/init/`
- CORS is enabled for development (all origins allowed)
- Game supports 2-4 players, automatic turn management, standard 52-card deck