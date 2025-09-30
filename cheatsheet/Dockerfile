# ---------- Build stage ----------
FROM golang:1.25 AS builder

WORKDIR /app

# cache deps
COPY go.mod go.sum ./
RUN go mod download

# copy source 
COPY . .

# build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o cheatsheet ./cmd/api

# ---------- Run stage ----------
FROM alpine:3.19

WORKDIR /app

# copy binary from builder
COPY --from=builder /app/cheatsheet .

# copy env
COPY .env .env

EXPOSE 3000

CMD ["./cheatsheet"]
