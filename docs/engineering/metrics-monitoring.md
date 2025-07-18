# Metrics & Monitoring Guide

This guide covers the OpenTelemetry (OTLP) metrics support in the Personas MCP Server for monitoring performance and usage.

## Overview

The server includes built-in OpenTelemetry metrics support that exports to OTLP-compatible collectors. Metrics help you:

- Monitor server health and performance
- Track persona usage patterns
- Identify bottlenecks and issues
- Measure API response times
- Analyze system resource usage

## Quick Start

### Basic Setup

Metrics are enabled by default. The server exports to `http://localhost:4318/v1/metrics`.

```bash
# Run with default metrics enabled
npm start

# Disable metrics
METRICS_ENABLED=false npm start

# Custom OTLP endpoint
METRICS_ENDPOINT=http://otel-collector:4318/v1/metrics npm start
```

### With Docker Compose

```yaml
version: '3.8'

services:
  personas-mcp:
    image: personas-mcp:latest
    environment:
      - METRICS_ENABLED=true
      - METRICS_ENDPOINT=http://otel-collector:4318/v1/metrics
    ports:
      - "3000:3000"

  otel-collector:
    image: otel/opentelemetry-collector:latest
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol/config.yaml
    ports:
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus metrics
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | `true` | Enable/disable metrics collection |
| `METRICS_ENDPOINT` | `http://localhost:4318/v1/metrics` | OTLP metrics endpoint |
| `METRICS_INTERVAL` | `60000` | Export interval in milliseconds |
| `METRICS_HEADERS` | `{}` | JSON string of headers for authentication |

### Authentication

For secured OTLP endpoints:

```bash
# Bearer token
METRICS_ENDPOINT=https://otel.example.com/v1/metrics \
METRICS_HEADERS='{"Authorization": "Bearer your-token"}' \
npm start

# Basic auth
METRICS_ENDPOINT=https://otel.example.com/v1/metrics \
METRICS_HEADERS='{"Authorization": "Basic dXNlcjpwYXNz"}' \
npm start

# Custom headers
METRICS_ENDPOINT=https://otel.example.com/v1/metrics \
METRICS_HEADERS='{"X-API-Key": "your-api-key", "X-Tenant-ID": "tenant-123"}' \
npm start
```

## Available Metrics

### HTTP Metrics

#### http_requests_total
Total number of HTTP requests received.

**Labels:**
- `method`: HTTP method (GET, POST, etc.)
- `endpoint`: Request endpoint path
- `status`: HTTP status code

**Example:**
```promql
# Total requests by endpoint
sum by (endpoint) (http_requests_total)

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

#### http_request_duration_seconds
HTTP request duration in seconds (histogram).

**Labels:**
- `method`: HTTP method
- `endpoint`: Request endpoint path
- `status`: HTTP status code

**Example:**
```promql
# 95th percentile latency by endpoint
histogram_quantile(0.95, 
  sum by (endpoint, le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)
```

#### http_active_connections
Current number of active HTTP connections (gauge).

**Example:**
```promql
# Current active connections
http_active_connections
```

### MCP Protocol Metrics

#### mcp_requests_total
Total number of MCP protocol requests.

**Labels:**
- `type`: Request type (tools/call, resources/list, etc.)
- `status`: Success or error

**Example:**
```promql
# MCP request rate
rate(mcp_requests_total[5m])

# Error rate by type
rate(mcp_requests_total{status="error"}[5m])
```

#### mcp_request_duration_seconds
MCP request processing duration (histogram).

**Labels:**
- `type`: Request type
- `status`: Success or error

#### mcp_errors_total
Total number of MCP protocol errors.

**Labels:**
- `type`: Error type (validation, processing, etc.)

### Persona Metrics

#### persona_requests_total
Total requests per persona.

**Labels:**
- `persona_id`: Persona identifier
- `operation`: Operation type (adopt, recommend, etc.)

**Example:**
```promql
# Most used personas
topk(5, sum by (persona_id) (persona_requests_total))
```

#### persona_prompt_generations_total
Number of prompts generated per persona.

**Labels:**
- `persona_id`: Persona identifier

#### persona_load_duration_seconds
Time taken to load personas (histogram).

**Labels:**
- `source`: Load source (built-in, user, project)

### Tool Metrics

#### tool_invocations_total
Total tool invocations.

**Labels:**
- `name`: Tool name
- `status`: Success or error

**Example:**
```promql
# Tool usage distribution
sum by (name) (tool_invocations_total)
```

#### tool_execution_duration_seconds
Tool execution duration (histogram).

**Labels:**
- `name`: Tool name
- `status`: Success or error

#### tool_errors_total
Total tool execution errors.

**Labels:**
- `name`: Tool name
- `error_type`: Type of error

## Collector Configuration

### OpenTelemetry Collector

Example configuration for the OpenTelemetry Collector:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  # Prometheus exporter
  prometheus:
    endpoint: "0.0.0.0:8889"
    const_labels:
      service: "personas-mcp"
  
  # Jaeger exporter (optional)
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  
  # Datadog exporter (optional)
  datadog:
    api:
      key: ${DD_API_KEY}
      site: datadoghq.com

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024
  
  memory_limiter:
    limit_mib: 512
    spike_limit_mib: 128
    check_interval: 5s

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
```

### Prometheus Configuration

Scrape metrics from the collector:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'personas-mcp'
    static_configs:
      - targets: ['otel-collector:8889']
```

## Monitoring Dashboards

### Grafana Dashboard Example

Import this dashboard JSON for basic monitoring:

```json
{
  "dashboard": {
    "title": "Personas MCP Server",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Response Time (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Persona Usage",
        "targets": [{
          "expr": "sum by (persona_id) (persona_requests_total)"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(mcp_errors_total[5m])"
        }]
      }
    ]
  }
}
```

### Key Metrics to Monitor

1. **Health Indicators**
   - Request rate and error rate
   - Response time percentiles (p50, p95, p99)
   - Active connections
   - Memory and CPU usage

2. **Usage Patterns**
   - Most used personas
   - Tool invocation frequency
   - Peak usage times
   - User request patterns

3. **Performance Metrics**
   - Persona loading time
   - Recommendation calculation time
   - API endpoint latencies
   - Resource utilization

## Alerting

### Example Alert Rules

```yaml
# alerts.yml
groups:
  - name: personas-mcp
    rules:
      - alert: HighErrorRate
        expr: rate(mcp_errors_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        annotations:
          summary: "95th percentile response time > 1s"
          
      - alert: PersonaLoadFailure
        expr: increase(persona_load_duration_seconds_count{status="error"}[5m]) > 0
        annotations:
          summary: "Persona loading failures detected"
```

## Best Practices

### 1. Resource Management

- Set appropriate memory limits for the collector
- Use batch processing to reduce network overhead
- Configure retention policies for metrics storage

### 2. Label Cardinality

- Avoid high-cardinality labels (like user IDs)
- Use bounded label values
- Monitor label cardinality growth

### 3. Sampling

For high-traffic environments:

```bash
# Sample 10% of requests
METRICS_SAMPLING_RATE=0.1 npm start
```

### 4. Security

- Always use HTTPS for remote collectors
- Rotate authentication tokens regularly
- Limit collector access to metrics endpoints only

## Troubleshooting

### Metrics Not Appearing

1. Check if metrics are enabled:
   ```bash
   echo $METRICS_ENABLED
   ```

2. Verify collector is running:
   ```bash
   curl http://localhost:4318/v1/metrics
   ```

3. Check server logs:
   ```bash
   grep -i metric server.log
   ```

### High Memory Usage

1. Reduce export interval:
   ```bash
   METRICS_INTERVAL=30000 npm start
   ```

2. Enable sampling:
   ```bash
   METRICS_SAMPLING_RATE=0.1 npm start
   ```

### Authentication Failures

1. Verify headers format:
   ```bash
   echo $METRICS_HEADERS | jq .
   ```

2. Test with curl:
   ```bash
   curl -H "Authorization: Bearer token" https://collector/v1/metrics
   ```

## Integration Examples

### Datadog

```bash
METRICS_ENDPOINT=https://otel.datadoghq.com/v1/metrics \
METRICS_HEADERS='{"DD-API-KEY": "your-api-key"}' \
npm start
```

### New Relic

```bash
METRICS_ENDPOINT=https://otlp.nr-data.net:4318/v1/metrics \
METRICS_HEADERS='{"api-key": "your-license-key"}' \
npm start
```

### AWS CloudWatch

Use the AWS Distro for OpenTelemetry Collector:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  awsemf:
    region: us-east-1
    namespace: PersonasMCP
```

## Performance Impact

Metrics collection has minimal performance impact:

- ~2-5% CPU overhead
- ~10-20MB memory for metrics buffer
- Network bandwidth depends on export interval

To minimize impact:
- Increase export interval for low-priority metrics
- Use sampling for high-frequency operations
- Disable detailed histograms if not needed

## Next Steps

- Set up dashboards for your key metrics
- Configure alerts for critical thresholds
- Integrate with your existing monitoring stack
- Review metrics regularly to optimize performance