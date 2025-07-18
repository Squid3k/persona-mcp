#!/usr/bin/env python3
"""
Python Client Example for Personas MCP Server

This example demonstrates how to interact with the Personas MCP Server
using Python and the requests library.
"""

import json
import sys
from typing import Dict, List, Any
import requests
from datetime import datetime


class PersonasMCPClient:
    """Client for interacting with the Personas MCP Server"""
    
    def __init__(self, mcp_url: str = "http://localhost:3000/mcp", 
                 api_url: str = "http://localhost:3000/api"):
        self.mcp_url = mcp_url
        self.api_url = api_url
        self.session = requests.Session()
        self.request_id = 0
    
    def _get_request_id(self) -> int:
        """Generate a unique request ID"""
        self.request_id += 1
        return self.request_id
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool using JSON-RPC protocol"""
        request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": self._get_request_id()
        }
        
        try:
            response = self.session.post(
                self.mcp_url,
                json=request,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            result = response.json()
            if "error" in result:
                raise Exception(f"MCP Error: {result['error'].get('message', 'Unknown error')}")
            
            return result.get("result", {})
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")
    
    def get_personas(self) -> List[Dict[str, Any]]:
        """Get all available personas via REST API"""
        response = self.session.get(f"{self.api_url}/personas")
        response.raise_for_status()
        return response.json()
    
    def get_persona(self, persona_id: str) -> Dict[str, Any]:
        """Get a specific persona by ID"""
        response = self.session.get(f"{self.api_url}/personas/{persona_id}")
        response.raise_for_status()
        return response.json()


def example_1_get_recommendations(client: PersonasMCPClient):
    """Example 1: Get persona recommendations for a task"""
    print("🎯 Example 1: Getting Persona Recommendations\n")
    
    task = {
        "title": "Implement real-time chat system",
        "description": "Build a scalable real-time chat system with WebSocket support, "
                      "message persistence, and user presence indicators",
        "keywords": ["websocket", "real-time", "chat", "scalability"],
        "complexity": "complex",
        "domain": "backend"
    }
    
    try:
        result = client.call_tool("recommend-persona", task)
        recommendations = result["data"]["recommendations"]
        
        print(f"Task: {task['title']}")
        print(f"Description: {task['description']}")
        print("\nRecommended Personas:")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['personaId']} (Score: {rec['score']}%)")
            print(f"   Reasoning: {rec['reasoning']}")
            print(f"   Strengths: {', '.join(rec['strengths'])}")
            print(f"   Confidence: {rec['confidence']}%")
            
            if rec.get('limitations'):
                print(f"   Limitations: {', '.join(rec['limitations'])}")
    
    except Exception as e:
        print(f"Error: {e}")


def example_2_explain_persona_fit(client: PersonasMCPClient):
    """Example 2: Explain why a specific persona fits a task"""
    print("\n\n🔍 Example 2: Explaining Persona Fit\n")
    
    request = {
        "personaId": "architect",
        "title": "Microservices migration",
        "description": "Migrate monolithic application to microservices architecture",
        "keywords": ["microservices", "migration", "architecture", "refactoring"],
        "complexity": "expert",
        "domain": "backend"
    }
    
    try:
        result = client.call_tool("explain-persona-fit", request)
        data = result["data"]
        
        print(f"Persona: {data['persona']['name']}")
        print(f"Task: {request['title']}")
        print(f"\nScore: {data['score']}%")
        print(f"Confidence: {data['confidence']}%")
        print(f"\nReasoning: {data['reasoning']}")
        
        print("\nStrengths for this task:")
        for strength in data['strengths']:
            print(f"  - {strength}")
        
        if data.get('limitations'):
            print("\nLimitations:")
            for limitation in data['limitations']:
                print(f"  - {limitation}")
    
    except Exception as e:
        print(f"Error: {e}")


def example_3_compare_personas(client: PersonasMCPClient):
    """Example 3: Compare multiple personas for a task"""
    print("\n\n⚖️  Example 3: Comparing Personas\n")
    
    comparison = {
        "personaIds": ["developer", "optimizer", "performance-analyst"],
        "title": "Optimize API response times",
        "description": "Our REST API has slow response times. Need to identify "
                      "bottlenecks and implement optimizations",
        "keywords": ["performance", "optimization", "api", "latency"],
        "complexity": "complex"
    }
    
    try:
        result = client.call_tool("compare-personas", comparison)
        comparisons = result["data"]["comparisons"]
        
        print(f"Task: {comparison['title']}")
        print("\nPersona Comparison (sorted by score):")
        
        # Sort by score descending
        sorted_comparisons = sorted(comparisons, key=lambda x: x['score'], reverse=True)
        
        for i, comp in enumerate(sorted_comparisons, 1):
            print(f"\n{i}. {comp['personaId']} (Score: {comp['score']}%)")
            print(f"   {comp['reasoning']}")
            print(f"   Key strengths: {comp['strengths'][0] if comp['strengths'] else 'N/A'}")
            print(f"   Confidence: {comp['confidence']}%")
    
    except Exception as e:
        print(f"Error: {e}")


def example_4_use_rest_api(client: PersonasMCPClient):
    """Example 4: Using REST API endpoints directly"""
    print("\n\n🌐 Example 4: Using REST API Endpoints\n")
    
    try:
        # Get all personas
        print("Fetching all personas...")
        personas = client.get_personas()
        print(f"\nFound {len(personas)} personas:")
        
        # Group by role
        by_role = {}
        for persona in personas:
            role = persona.get('role', 'unknown')
            if role not in by_role:
                by_role[role] = []
            by_role[role].append(persona)
        
        for role, role_personas in by_role.items():
            print(f"\n  {role.title()}:")
            for p in role_personas:
                print(f"    - {p['id']}: {p['name']}")
        
        # Get specific persona details
        print("\n\nFetching security-analyst persona details...")
        security = client.get_persona("security-analyst")
        
        print(f"\n{security['name']}:")
        print(f"Role: {security['role']}")
        print(f"Description: {security['description']}")
        print(f"Approach: {security.get('approach', 'N/A')}")
        
        if security.get('expertise'):
            print(f"Expertise areas: {', '.join(security['expertise'][:5])}...")
    
    except Exception as e:
        print(f"Error: {e}")


def example_5_system_stats(client: PersonasMCPClient):
    """Example 5: Get system statistics"""
    print("\n\n📊 Example 5: System Statistics\n")
    
    try:
        result = client.call_tool("get-recommendation-stats", {})
        stats = result["data"]
        
        print(f"Total Personas: {stats['totalPersonas']}")
        print(f"Available Roles: {', '.join(stats['availableRoles'])}")
        
        print("\nScoring Algorithm Weights:")
        for factor, weight in stats['scoringWeights'].items():
            # Convert camelCase to readable format
            readable = factor.replace('Match', ' Match').replace('Fit', ' Fit')
            print(f"  {readable.title()}: {int(weight * 100)}%")
        
        print(f"\nSystem Version: {stats['systemInfo']['version']}")
        print("Features:")
        for feature in stats['systemInfo']['features']:
            print(f"  - {feature}")
    
    except Exception as e:
        print(f"Error: {e}")


def example_6_practical_workflow(client: PersonasMCPClient):
    """Example 6: Practical workflow for problem solving"""
    print("\n\n🔄 Example 6: Practical Problem-Solving Workflow\n")
    
    # Step 1: Define the problem
    problem = {
        "title": "Database performance issues",
        "description": "Production database experiencing slow queries, high CPU usage, "
                      "and occasional timeouts during peak hours",
        "keywords": ["database", "performance", "sql", "optimization", "production"],
        "complexity": "complex",
        "urgency": "high"
    }
    
    print("Problem:", problem["title"])
    print("Description:", problem["description"])
    
    try:
        # Step 2: Get recommendations
        print("\n1. Getting persona recommendations...")
        result = client.call_tool("recommend-persona", problem)
        recommendations = result["data"]["recommendations"]
        
        if not recommendations:
            print("No recommendations found!")
            return
        
        # Use top recommendation
        best_persona = recommendations[0]
        print(f"   Best match: {best_persona['personaId']} ({best_persona['score']}%)")
        
        # Step 3: Understand why this persona is best
        print(f"\n2. Understanding why {best_persona['personaId']} is recommended...")
        explain_result = client.call_tool("explain-persona-fit", {
            "personaId": best_persona['personaId'],
            **problem
        })
        
        explanation = explain_result["data"]
        print(f"   {explanation['reasoning']}")
        
        # Step 4: Consider alternatives
        print("\n3. Comparing with alternative approaches...")
        alternative_personas = ["optimizer", "database-admin", "debugger"][:3]  # Limit to available
        
        compare_result = client.call_tool("compare-personas", {
            "personaIds": alternative_personas,
            **problem
        })
        
        comparisons = compare_result["data"]["comparisons"]
        print("   Alternative perspectives:")
        for comp in sorted(comparisons, key=lambda x: x['score'], reverse=True)[:2]:
            print(f"   - {comp['personaId']}: {comp['reasoning']}")
        
        print("\n✅ Workflow complete! You now have:")
        print(f"   1. Primary persona: {best_persona['personaId']}")
        print("   2. Understanding of why it's best")
        print("   3. Alternative perspectives to consider")
        
    except Exception as e:
        print(f"Error in workflow: {e}")


def main():
    """Run all examples"""
    print("🚀 Personas MCP Server - Python Client Examples\n")
    print("Make sure the server is running: npm start")
    print("=" * 60)
    
    # Create client
    client = PersonasMCPClient()
    
    # Test connection
    try:
        print("\nTesting connection...")
        client.session.get("http://localhost:3000/health").raise_for_status()
        print("✅ Server is running!\n")
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to server!")
        print("Please ensure the Personas MCP Server is running on http://localhost:3000")
        sys.exit(1)
    
    # Run examples
    try:
        example_1_get_recommendations(client)
        example_2_explain_persona_fit(client)
        example_3_compare_personas(client)
        example_4_use_rest_api(client)
        example_5_system_stats(client)
        example_6_practical_workflow(client)
        
        print("\n\n✅ All examples completed successfully!")
        print("\nNext steps:")
        print("  - Integrate PersonasMCPClient into your Python applications")
        print("  - Create custom personas for your specific needs")
        print("  - Build automation around persona recommendations")
        
    except KeyboardInterrupt:
        print("\n\nExamples interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error running examples: {e}")


if __name__ == "__main__":
    main()