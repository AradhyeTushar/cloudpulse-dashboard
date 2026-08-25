.PHONY: all up down build test restart logs clean

all: build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose build

test:
	@echo "Running backend tests..."
	cd backend && go test -v ./internal/...
	@echo "Verifying frontend build..."
	cd frontend && npm run build

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf backend/bin gateway/bin frontend/dist
