# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/gateway ./cmd/gateway

# Final minimal runtime
FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/bin/gateway /app/gateway
COPY config/ /app/config/

USER 65534:65534

EXPOSE 8000 9100 1080

ENTRYPOINT ["/app/gateway"]
