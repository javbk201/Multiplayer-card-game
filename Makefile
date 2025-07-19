.PHONY: help install dev build clean docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development servers"
	@echo "  build       - Build all components"
	@echo "  clean       - Clean build artifacts"
	@echo "  docker-up   - Start PostgreSQL with Docker"
	@echo "  docker-down - Stop PostgreSQL"
	@echo "  test        - Run tests"

# Install dependencies
install:
	@echo "Installing dependencies..."
	bun install
	cd frontend && bun install
	@echo "Dependencies installed!"

# Start development
dev:
	@echo "Starting development servers..."
	@echo "Frontend will be available at http://localhost:5173"
	@echo "Backend will be available at http://localhost:8000"
	@echo "Database admin at http://localhost:8080"
	@make docker-up
	sleep 3
	concurrently "make dev-backend" "make dev-frontend"

# Individual dev commands
dev-frontend:
	cd frontend && bun run dev

dev-backend:
	cd backend && go run cmd/main.go

# Build everything
build:
	@echo "Building frontend..."
	cd frontend && bun run build
	@echo "Building backend..."
	cd backend && go build -o bin/server cmd/main.go
	@echo "Build complete!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf backend/bin
	@echo "Clean complete!"

# Docker commands
docker-up:
	@echo "Starting PostgreSQL..."
	docker-compose up -d postgres adminer
	@echo "PostgreSQL started!"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "Docker services stopped!"

# Test commands
test:
	@echo "Running frontend tests..."
	cd frontend && bun test

# Lint commands
lint:
	@echo "Running frontend linting..."
	cd frontend && bun run lint

# Database commands
db-reset:
	@echo "Resetting database..."
	docker-compose down
	docker volume rm card-game-multiplayer_postgres_data || true
	docker-compose up -d postgres adminer
	@echo "Database reset complete!"

# Production build
prod-build:
	@echo "Building for production..."
	cd frontend && bun run build
	cd backend && CGO_ENABLED=0 GOOS=linux go build -o bin/server cmd/main.go
	@echo "Production build complete!"