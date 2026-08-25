.PHONY: all build run test clean docker-up docker-down tidy

all: build

build:
	@mkdir -p bin
	go build -o bin/api ./cmd/api

run:
	go run ./cmd/api

test:
	go test -v ./internal/...

tidy:
	go mod tidy

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf bin/
