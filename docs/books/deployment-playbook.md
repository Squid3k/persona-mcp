# Deployment Playbook

## Overview

This playbook provides step-by-step instructions for deploying the Personas MCP Server in various environments.

## Prerequisites

- Node.js 18+ installed on target system
- Git for cloning repository
- PM2 for process management (production)
- Nginx for reverse proxy (optional)

## Deployment Environments

### 1. Local Development

```bash
# Clone and setup
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp
npm install
npm run build

# Start server
npm start
```

### 2. Production Server

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash personas
sudo su - personas
```

#### Step 2: Application Setup

```bash
# Clone repository
git clone https://github.com/pidster/persona-mcp.git
cd persona-mcp

# Install production dependencies
npm ci --production

# Build application
npm run build

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
EOF
```

#### Step 3: PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'personas-mcp',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

#### Step 4: Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided

# Check status
pm2 status
pm2 logs personas-mcp
```

### 3. Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  personas-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
    volumes:
      - ./personas:/app/personas
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Deploy with Docker

```bash
# Build image
docker build -t personas-mcp .

# Run container
docker run -d \
  --name personas-mcp \
  -p 3000:3000 \
  -v $(pwd)/personas:/app/personas \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  personas-mcp

# Using docker-compose
docker-compose up -d
```

### 4. Kubernetes Deployment

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: personas-mcp
  labels:
    app: personas-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: personas-mcp
  template:
    metadata:
      labels:
        app: personas-mcp
    spec:
      containers:
      - name: personas-mcp
        image: personas-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: personas-mcp-service
spec:
  selector:
    app: personas-mcp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Nginx Configuration

### Reverse Proxy Setup

```nginx
server {
    listen 80;
    server_name personas.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name personas.example.com;

    ssl_certificate /etc/letsencrypt/live/personas.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/personas.example.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... same proxy settings as above
    }
}
```

## Environment Variables

### Production Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS
CORS_ENABLED=true
CORS_ORIGINS=https://app.example.com,https://api.example.com

# Persona Paths
PERSONAS_PATH=/app/personas
PERSONAS_WATCH=true

# Performance
MAX_PERSONAS=100
CACHE_TTL=3600
```

## Health Monitoring

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "Health check passed"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Health check failed, retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    fi
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
```

### Monitoring Setup

```bash
# Install monitoring tools
npm install -g clinic

# CPU profiling
clinic doctor -- node dist/index.js

# Memory profiling
clinic heap -- node dist/index.js

# Event loop monitoring
clinic bubbleprof -- node dist/index.js
```

## Backup and Recovery

### Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/personas-mcp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup application files
cp -r /app/personas $BACKUP_DIR/$BACKUP_NAME/
cp -r /app/logs $BACKUP_DIR/$BACKUP_NAME/
cp /app/.env $BACKUP_DIR/$BACKUP_NAME/

# Compress backup
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$BACKUP_NAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

### Recovery Process

```bash
# Stop application
pm2 stop personas-mcp

# Extract backup
tar -xzf /backup/personas-mcp/backup_20250715_120000.tar.gz -C /tmp

# Restore files
cp -r /tmp/backup_20250715_120000/personas/* /app/personas/
cp /tmp/backup_20250715_120000/.env /app/.env

# Restart application
pm2 restart personas-mcp
```

## Deployment Checklist

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Backup taken
- [ ] Rollback plan prepared

### Deployment Steps

- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Build application
- [ ] Run health check
- [ ] Update load balancer
- [ ] Monitor logs
- [ ] Verify functionality

### Post-Deployment

- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] No errors in logs
- [ ] User acceptance verified
- [ ] Monitoring alerts configured
- [ ] Documentation updated

## Rollback Procedure

### Quick Rollback

```bash
# Using PM2
pm2 stop personas-mcp
git checkout <previous-version>
npm ci
npm run build
pm2 restart personas-mcp

# Using Docker
docker stop personas-mcp
docker run -d --name personas-mcp <previous-image-tag>
```

### Database Rollback

Not applicable - this service doesn't use a database.

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process
   sudo lsof -i :3000
   # Kill process
   sudo kill -9 <PID>
   ```

2. **Permission Denied**
   ```bash
   # Fix permissions
   sudo chown -R personas:personas /app
   ```

3. **Out of Memory**
   ```bash
   # Increase memory limit
   pm2 stop personas-mcp
   pm2 start ecosystem.config.js --max-memory-restart 2G
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   sudo certbot renew
   sudo nginx -s reload
   ```

## Performance Tuning

### Node.js Optimization

```bash
# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Enable production optimizations
NODE_ENV=production npm start
```

### PM2 Optimization

```javascript
// ecosystem.config.js
{
  instances: 'max',
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  min_uptime: '10s',
  max_restarts: 10
}
```

## Security Hardening

### System Security

```bash
# Firewall rules
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban for SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Application Security

```bash
# Run as non-root user
sudo -u personas npm start

# Set file permissions
chmod 600 .env
chmod 755 dist/

# Environment validation
npm audit
npm audit fix
```