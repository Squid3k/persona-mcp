# Troubleshooting Runbook

## Overview

This runbook provides systematic approaches to diagnose and resolve common issues with the Personas MCP Server.

## Quick Diagnostics

### System Health Check

```bash
# 1. Check if server is running
curl -f http://localhost:3000/health

# 2. Check server logs
pm2 logs personas-mcp --lines 100

# 3. Check system resources
free -h
df -h
top -n 1

# 4. Check port availability
netstat -tulpn | grep 3000
```

## Common Issues and Solutions

### 1. Server Won't Start

#### Symptoms
- Server fails to start
- Process exits immediately
- No response on configured port

#### Diagnosis Steps

```bash
# Check for port conflicts
lsof -i :3000

# Check Node.js version
node --version  # Should be 18+

# Check for missing dependencies
npm ls

# Try starting directly
node dist/index.js

# Check for TypeScript build errors
npm run build
```

#### Solutions

**Port Already in Use**
```bash
# Check what's using the port
lsof -i :3000

# Option 1: Kill existing process
kill -9 $(lsof -t -i:3000)

# Option 2: Use different port
npm start -- --port 8080
# or
PORT=3001 npm start
```

**Missing Dependencies**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Build Errors**
```bash
# Check TypeScript errors
npm run typecheck

# Clean build
rm -rf dist/
npm run build
```

### 2. Personas Not Loading

#### Symptoms
- Empty persona list
- Missing custom personas
- File not found errors

#### Diagnosis Steps

```bash
# Check persona directories
ls -la ~/.ai/personas/
ls -la ./.ai/personas/

# Check file permissions
ls -la ~/.ai/personas/*.yaml

# Validate YAML syntax
npm run validate-personas

# Check logs for load errors
grep -i "persona" logs/error.log

# Check server logs for validation errors
npm run dev  # Run in development mode to see errors
```

#### Solutions

**Permission Issues**
```bash
# Fix directory permissions
chmod 755 ~/.ai/personas
chmod 644 ~/.ai/personas/*.yaml
```

**Invalid YAML**
```yaml
# Validate YAML structure
# Required fields:
id: my-persona
name: My Persona
version: "1.0"
role: specialist
description: Description here
```

**Common YAML Errors**
- Ensure file extension is `.yaml` (not `.yml`)
- Check for proper indentation (2 spaces)
- Verify quotes around strings with special characters
- Validate with online YAML validator

**Path Issues**
```bash
# Set explicit path
export PERSONAS_PATH=/absolute/path/to/personas
npm start
```

### 3. High Memory Usage

#### Symptoms
- Server consuming excessive RAM
- OOM (Out of Memory) errors
- Slow response times

#### Diagnosis Steps

```bash
# Check memory usage
pm2 monit

# Generate heap snapshot
kill -USR2 $(pgrep -f personas-mcp)

# Check for memory leaks
node --inspect dist/index.js
# Open chrome://inspect
```

#### Solutions

**Increase Memory Limit**
```bash
# PM2 configuration
pm2 stop personas-mcp
pm2 start ecosystem.config.js --max-memory-restart 2G

# Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

**Fix Memory Leaks**
```javascript
// Check for common leaks
// 1. Event listeners not removed
// 2. Circular references
// 3. Large objects in cache
```

### 4. Slow Response Times

#### Symptoms
- API calls taking > 1 second
- Timeouts on recommendations
- Poor scoring performance

#### Diagnosis Steps

```bash
# Profile CPU usage
node --prof dist/index.js
# Let it run, then process
node --prof-process isolate-*.log > profile.txt

# Check response times
time curl http://localhost:3000/health

# Monitor real-time performance
pm2 monit
```

#### Solutions

**Enable Caching**
```javascript
// In-memory cache for personas
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour
```

**Optimize Scoring**
```javascript
// Batch persona scoring
const scores = await Promise.all(
  personas.map(p => scorer.scorePersona(p, task))
);
```

### 5. Connection Issues

#### Symptoms
- Claude can't connect to server
- "HTTP 404" errors
- "Dynamic client registration failed"
- ECONNREFUSED errors

#### Diagnosis Steps

```bash
# Ensure server is running
curl http://localhost:3000/health

# Check if correct endpoint is used
curl -H "Accept: text/event-stream" http://localhost:3000/mcp

# Check firewall settings
sudo iptables -L -n | grep 3000

# Verify CORS settings
curl -I http://localhost:3000/ -H "Origin: http://localhost"
```

#### Solutions

**Wrong Endpoint URL**
- Ensure configuration uses `http://localhost:3000/mcp` (not just `http://localhost:3000`)
- For HTTP transport:
```json
{
  "transport": {
    "type": "http",
    "url": "http://localhost:3000/mcp"
  }
}
```

**Connection Refused**
- Start the server: `npm start`
- Check server is on correct port: `npm start -- --port 3000`
- Verify no firewall blocking

**Transport Type Issues**
- Use local command execution instead of HTTP:
```json
{
  "mcpServers": {
    "personas": {
      "command": "node",
      "args": ["/absolute/path/to/persona-mcp/dist/index.js"]
    }
  }
}
```

### 6. MCP Protocol Errors

#### Symptoms
- Invalid JSON-RPC responses
- Protocol version mismatches
- Connection failures

#### Diagnosis Steps

```bash
# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Check transport logs
DEBUG=mcp:* npm start

# Validate request format
cat request.json | jq .
```

#### Solutions

**Protocol Mismatch**
```javascript
// Ensure correct protocol version
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": { /* ... */ },
  "id": 1
}
```

**CORS Issues**
```bash
# Enable CORS for client
npm start -- --cors
# Or specify origins
CORS_ORIGINS=https://app.example.com npm start
```

### 6. File Watcher Issues

#### Symptoms
- Changes not detected
- Too many open files error
- High CPU from watching

#### Diagnosis Steps

```bash
# Check file descriptor limit
ulimit -n

# List watched files
lsof -p $(pgrep -f personas-mcp) | grep -E '(REG|DIR)'

# Check watcher events
DEBUG=watcher:* npm start
```

#### Solutions

**Increase File Limits**
```bash
# Temporary increase
ulimit -n 4096

# Permanent increase
echo "* soft nofile 4096" >> /etc/security/limits.conf
echo "* hard nofile 8192" >> /etc/security/limits.conf
```

**Disable Watching**
```bash
# Disable file watching
PERSONAS_WATCH=false npm start
```

### 7. Recommendation Accuracy Issues

#### Symptoms
- Poor persona matches
- Unexpected recommendations
- Low confidence scores

#### Diagnosis Steps

```bash
# Enable debug scoring
DEBUG=recommendation:* npm start

# Test specific scenarios
curl -X POST http://localhost:3000/mcp \
  -d @test-recommendation.json

# Check scoring weights
curl http://localhost:3000/mcp \
  -d '{"method":"tools/call","params":{"name":"get-recommendation-stats"}}'
```

#### Solutions

**Adjust Scoring Weights**
```javascript
// Customize weights for your use case
const weights = {
  keywordMatch: 0.4,    // Increase for keyword focus
  roleAlignment: 0.3,   // Increase for role matching
  expertiseMatch: 0.2,  // Expertise importance
  contextRelevance: 0.05,
  complexityFit: 0.05
};
```

**Improve Task Description**
```json
{
  "title": "Specific, clear title",
  "description": "Detailed description with context",
  "keywords": ["relevant", "specific", "terms"],
  "complexity": "appropriate-level",
  "domain": "specific-domain"
}
```

## Performance Diagnostics

### CPU Profiling

```bash
# Generate CPU profile
node --cpu-prof dist/index.js
# Stop after load test
# Analyze with Chrome DevTools

# Using clinic.js
npx clinic doctor -- node dist/index.js
```

### Memory Profiling

```bash
# Heap snapshot on demand
node --inspect dist/index.js
# Chrome DevTools > Memory > Take Heap Snapshot

# Memory usage over time
npx clinic heap -- node dist/index.js
```

### Request Tracing

```javascript
// Add request timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});
```

## Debug Modes

### Enable Debug Logging

```bash
# All debug output
DEBUG=* npm start

# Specific modules
DEBUG=personas:*,recommendation:* npm start

# MCP protocol debugging
DEBUG=mcp:* npm start
```

### Verbose Output

```javascript
// Add to startup
if (process.env.VERBOSE) {
  console.log('Configuration:', config);
  console.log('Loaded personas:', personaManager.getAllPersonas());
}
```

## Emergency Procedures

### Server Unresponsive

```bash
# 1. Check if process exists
ps aux | grep personas-mcp

# 2. Force restart
pm2 restart personas-mcp --force

# 3. If still failing, kill and restart
pm2 delete personas-mcp
pm2 start ecosystem.config.js
```

### Data Corruption

```bash
# 1. Stop server
pm2 stop personas-mcp

# 2. Backup current state
cp -r ~/.ai/personas ~/.ai/personas.backup

# 3. Validate all personas
find ~/.ai/personas -name "*.yaml" -exec yaml-lint {} \;

# 4. Remove corrupted files
# 5. Restart server
pm2 start personas-mcp
```

### Rollback Deployment

```bash
# 1. Stop current version
pm2 stop personas-mcp

# 2. Checkout previous version
git checkout tags/v1.0.0

# 3. Rebuild
npm ci
npm run build

# 4. Restart
pm2 restart personas-mcp
```

## Monitoring Commands

### Real-time Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Network connections
netstat -c -tulpn | grep 3000

# Log streaming
tail -f logs/error.log
```

### Health Checks

```bash
# Basic health
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/health | jq .

# Ready check
curl http://localhost:3000/ready
```

## Log Analysis

### Common Log Patterns

```bash
# Find errors
grep -i error logs/*.log

# Find warnings
grep -i warn logs/*.log

# Find specific persona issues
grep -i "persona.*architect" logs/*.log

# Find performance issues
grep -E "took [0-9]{4,}ms" logs/*.log
```

### Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

## Recovery Procedures

### From Backup

```bash
# 1. Locate backup
ls -la /backup/personas-mcp/

# 2. Extract backup
tar -xzf backup_20250715.tar.gz

# 3. Restore personas
cp -r backup/personas/* ~/.ai/personas/

# 4. Restart service
pm2 restart personas-mcp
```

### From Git

```bash
# 1. Clone fresh copy
git clone https://github.com/pidster/persona-mcp.git personas-mcp-recovery

# 2. Build and test
cd personas-mcp-recovery
npm ci
npm run build
npm test

# 3. Replace current installation
pm2 stop personas-mcp
mv ../personas-mcp ../personas-mcp.old
mv ../personas-mcp-recovery ../personas-mcp
cd ../personas-mcp
pm2 start ecosystem.config.js
```

## Contact Information

### Escalation Path

1. **Level 1**: Check this runbook
2. **Level 2**: Development team
3. **Level 3**: System administrator
4. **Emergency**: On-call engineer

### Support Resources

- GitHub Issues: https://github.com/pidster/persona-mcp/issues
- Documentation: /docs/
- Logs: /logs/
- Monitoring: PM2 Dashboard