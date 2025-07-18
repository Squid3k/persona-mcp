#!/bin/bash
# Curl Examples for Personas MCP Server
# 
# This script demonstrates how to interact with the Personas MCP Server
# using curl commands. Useful for testing and debugging.

# Configuration
MCP_URL="http://localhost:3000/mcp"
API_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Personas MCP Server - Curl Examples${NC}"
echo -e "${YELLOW}Make sure the server is running: npm start${NC}"
echo "=================================================="

# Function to pretty print JSON
pretty_json() {
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

# Test server health
echo -e "\n${GREEN}1. Testing Server Health${NC}"
echo "Command: curl http://localhost:3000/health"
curl -s http://localhost:3000/health | pretty_json

# Get server info
echo -e "\n\n${GREEN}2. Server Information${NC}"
echo "Command: curl http://localhost:3000/"
curl -s http://localhost:3000/ | pretty_json

# Example 1: Get persona recommendations
echo -e "\n\n${GREEN}3. Get Persona Recommendations (MCP Protocol)${NC}"
echo "Command: curl -X POST $MCP_URL -H 'Content-Type: application/json' -d '{...}'"

RECOMMENDATION_REQUEST='{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "recommend-persona",
    "arguments": {
      "title": "Build authentication system",
      "description": "Implement JWT-based authentication with refresh tokens and role-based access control",
      "keywords": ["authentication", "jwt", "security", "rbac"],
      "complexity": "moderate",
      "maxRecommendations": 3
    }
  },
  "id": 1
}'

echo -e "\nRequest:"
echo "$RECOMMENDATION_REQUEST" | pretty_json

echo -e "\nResponse:"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d "$RECOMMENDATION_REQUEST" | pretty_json

# Example 2: Explain persona fit
echo -e "\n\n${GREEN}4. Explain Persona Fit${NC}"
echo "Command: curl -X POST $MCP_URL -H 'Content-Type: application/json' -d '{...}'"

EXPLAIN_REQUEST='{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "explain-persona-fit",
    "arguments": {
      "personaId": "security-analyst",
      "title": "Security audit",
      "description": "Perform comprehensive security audit of web application",
      "keywords": ["security", "audit", "vulnerabilities", "pentesting"],
      "complexity": "complex"
    }
  },
  "id": 2
}'

echo -e "\nRequest:"
echo "$EXPLAIN_REQUEST" | pretty_json

echo -e "\nResponse:"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d "$EXPLAIN_REQUEST" | pretty_json

# Example 3: Compare personas
echo -e "\n\n${GREEN}5. Compare Multiple Personas${NC}"
echo "Command: curl -X POST $MCP_URL -H 'Content-Type: application/json' -d '{...}'"

COMPARE_REQUEST='{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "compare-personas",
    "arguments": {
      "personaIds": ["architect", "developer", "technical-writer"],
      "title": "API documentation",
      "description": "Create comprehensive API documentation with examples",
      "domain": "documentation",
      "complexity": "moderate"
    }
  },
  "id": 3
}'

echo -e "\nRequest:"
echo "$COMPARE_REQUEST" | pretty_json

echo -e "\nResponse:"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d "$COMPARE_REQUEST" | pretty_json

# Example 4: Get system stats
echo -e "\n\n${GREEN}6. Get System Statistics${NC}"
echo "Command: curl -X POST $MCP_URL -H 'Content-Type: application/json' -d '{...}'"

STATS_REQUEST='{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get-recommendation-stats",
    "arguments": {}
  },
  "id": 4
}'

echo -e "\nResponse:"
curl -s -X POST $MCP_URL \
  -H "Content-Type: application/json" \
  -d "$STATS_REQUEST" | pretty_json

# REST API Examples
echo -e "\n\n${GREEN}7. REST API: Get All Personas${NC}"
echo "Command: curl $API_URL/personas"

echo -e "\nResponse:"
curl -s $API_URL/personas | pretty_json

# Get specific persona
echo -e "\n\n${GREEN}8. REST API: Get Specific Persona${NC}"
echo "Command: curl $API_URL/personas/architect"

echo -e "\nResponse:"
curl -s $API_URL/personas/architect | pretty_json

# REST recommendation
echo -e "\n\n${GREEN}9. REST API: Get Recommendations${NC}"
echo "Command: curl -X POST $API_URL/recommend -H 'Content-Type: application/json' -d '{...}'"

REST_RECOMMEND_REQUEST='{
  "query": "debug memory leak in production",
  "limit": 2
}'

echo -e "\nRequest:"
echo "$REST_RECOMMEND_REQUEST" | pretty_json

echo -e "\nResponse:"
curl -s -X POST $API_URL/recommend \
  -H "Content-Type: application/json" \
  -d "$REST_RECOMMEND_REQUEST" | pretty_json

# Compare via REST
echo -e "\n\n${GREEN}10. REST API: Compare Personas${NC}"
echo "Command: curl -X POST $API_URL/compare -H 'Content-Type: application/json' -d '{...}'"

REST_COMPARE_REQUEST='{
  "persona1": "optimizer",
  "persona2": "performance-analyst",
  "context": "improving application performance"
}'

echo -e "\nRequest:"
echo "$REST_COMPARE_REQUEST" | pretty_json

echo -e "\nResponse:"
curl -s -X POST $API_URL/compare \
  -H "Content-Type: application/json" \
  -d "$REST_COMPARE_REQUEST" | pretty_json

# Useful one-liners
echo -e "\n\n${GREEN}Useful One-Liners:${NC}"
echo ""
echo "# Quick recommendation for a task:"
echo 'curl -s -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '"'"'{"jsonrpc":"2.0","method":"tools/call","params":{"name":"recommend-persona","arguments":{"title":"Your task here","description":"Task description"}},"id":1}'"'"' | jq .result.data.recommendations[0].personaId'
echo ""
echo "# List all persona IDs:"
echo 'curl -s http://localhost:3000/api/personas | jq -r .[].id'
echo ""
echo "# Get top recommendation for debugging:"
echo 'curl -s -X POST http://localhost:3000/api/recommend -H "Content-Type: application/json" -d '"'"'{"query":"debug issue","limit":1}'"'"' | jq -r .[0].persona.id'
echo ""

echo -e "\n${BLUE}✅ Examples completed!${NC}"
echo -e "\n${YELLOW}Tips:${NC}"
echo "  - Install 'jq' for better JSON formatting: brew install jq (macOS) or apt-get install jq (Linux)"
echo "  - Save responses to files: curl ... > response.json"
echo "  - Use -v flag for verbose output to debug issues"
echo "  - Check server logs if requests fail"