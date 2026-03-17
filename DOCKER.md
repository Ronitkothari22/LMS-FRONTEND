# Docker Setup Guide

This project includes optimized Docker configurations for both production and development environments.

## Production Build

### Quick Start with Docker Compose
```bash
# Build and run the production container
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop the container
docker-compose down
```

### Manual Docker Commands
```bash
# Build the production image
docker build -t joining-dots-frontend .

# Run the container
docker run -p 3000:3000 joining-dots-frontend

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://your-backend:8080/api \
  joining-dots-frontend
```

## Development Build

### Using Development Dockerfile
```bash
# Build development image
docker build -f Dockerfile.dev -t joining-dots-frontend-dev .

# Run development container with volume mounting
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  joining-dots-frontend-dev
```

### Using Docker Compose for Development
```bash
# Uncomment the app-dev service in docker-compose.yml, then:
docker-compose up app-dev --build
```

## Image Optimization Features

The production Dockerfile includes several optimizations for minimal image size:

1. **Multi-stage build**: Separates dependencies, build, and runtime stages
2. **Alpine Linux**: Uses lightweight Alpine base images
3. **Standalone output**: Leverages Next.js standalone build for minimal runtime
4. **Non-root user**: Runs as non-root user for security
5. **Proper layer caching**: Optimized layer order for better caching
6. **Health checks**: Built-in health monitoring
7. **Signal handling**: Uses dumb-init for proper signal handling

## Environment Variables

Set these environment variables when running the container:

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://your-backend:8080/api

# Optional
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

## Health Check

The container includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Build Arguments

You can customize the build with build arguments:

```bash
docker build \
  --build-arg NODE_VERSION=20 \
  -t joining-dots-frontend .
```

## Troubleshooting

### Container won't start
- Check if port 3000 is already in use
- Verify environment variables are set correctly
- Check container logs: `docker logs <container-id>`

### Build fails
- Ensure you have enough disk space
- Clear Docker cache: `docker system prune -a`
- Check if all required files are present and not in .dockerignore

### Performance issues
- Increase Docker memory allocation
- Use multi-core builds: `docker build --build-arg BUILDKIT_INLINE_CACHE=1`

## Security Notes

- Container runs as non-root user (nextjs:nodejs)
- Uses dumb-init for proper signal handling
- Minimal attack surface with Alpine Linux
- No unnecessary packages or files included
