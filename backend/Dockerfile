# Stage 1: Build the binary
FROM golang:alpine AS builder

WORKDIR /app

# Copy dependency definitions first to utilize docker cache
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application files
COPY . .

# Compile Go application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Create a minimal runner image
FROM alpine:latest

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/main .

# Expose the API port
EXPOSE 8080

# Set entry point
CMD ["./main"]
