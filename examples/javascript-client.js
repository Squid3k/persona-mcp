#!/usr/bin/env node
/**
 * JavaScript Client Example for Personas MCP Server
 *
 * This example demonstrates how to interact with the Personas MCP Server
 * using JavaScript and the fetch API.
 */

// Configuration
const MCP_SERVER_URL = 'http://localhost:3000/mcp';
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Call an MCP tool using the JSON-RPC protocol
 */
async function callMCPTool(toolName, args) {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
    id: Date.now(),
  };

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message || 'Unknown error');
    }

    return result.result;
  } catch (error) {
    console.error(`Error calling ${toolName}:`, error.message);
    throw error;
  }
}

/**
 * Example 1: Get persona recommendations for a task
 */
async function getRecommendations() {
  console.log('🎯 Example 1: Getting Persona Recommendations\n');

  const task = {
    title: 'Optimize database queries',
    description:
      'Our application is experiencing slow database queries in production. Need to analyze and optimize query performance.',
    keywords: ['database', 'performance', 'optimization', 'sql'],
    complexity: 'complex',
    domain: 'backend',
  };

  try {
    const result = await callMCPTool('recommend-persona', task);

    console.log(`Task: ${task.title}`);
    console.log(`Description: ${task.description}`);
    console.log('\nRecommended Personas:');

    result.data.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.personaId} (Score: ${rec.score}%)`);
      console.log(`   Reasoning: ${rec.reasoning}`);
      console.log(`   Strengths: ${rec.strengths.join(', ')}`);
      console.log(`   Confidence: ${rec.confidence}%`);
    });
  } catch (error) {
    console.error('Failed to get recommendations:', error);
  }
}

/**
 * Example 2: Explain why a specific persona fits a task
 */
async function explainPersonaFit() {
  console.log('\n\n🔍 Example 2: Explaining Persona Fit\n');

  const request = {
    personaId: 'debugger',
    title: 'Memory leak investigation',
    description: 'Node.js application consuming increasing memory over time',
    keywords: ['memory', 'leak', 'node.js', 'debugging'],
    complexity: 'complex',
  };

  try {
    const result = await callMCPTool('explain-persona-fit', request);

    console.log(`Persona: ${result.data.persona.name}`);
    console.log(`Task: ${request.title}`);
    console.log(`\nAnalysis:`);
    console.log(`Score: ${result.data.score}%`);
    console.log(`Reasoning: ${result.data.reasoning}`);
    console.log(`\nStrengths for this task:`);
    result.data.strengths.forEach(s => console.log(`  - ${s}`));

    if (result.data.limitations?.length > 0) {
      console.log(`\nLimitations:`);
      result.data.limitations.forEach(l => console.log(`  - ${l}`));
    }
  } catch (error) {
    console.error('Failed to explain fit:', error);
  }
}

/**
 * Example 3: Compare multiple personas
 */
async function comparePersonas() {
  console.log('\n\n⚖️  Example 3: Comparing Personas\n');

  const comparison = {
    personaIds: ['architect', 'developer', 'reviewer'],
    title: 'Design and implement REST API',
    description:
      'Create a RESTful API with authentication, rate limiting, and documentation',
    domain: 'backend',
    complexity: 'moderate',
  };

  try {
    const result = await callMCPTool('compare-personas', comparison);

    console.log(`Task: ${comparison.title}`);
    console.log('\nPersona Comparison:');

    result.data.comparisons
      .sort((a, b) => b.score - a.score)
      .forEach((comp, index) => {
        console.log(
          `\n${index + 1}. ${comp.personaId} (Score: ${comp.score}%)`
        );
        console.log(`   ${comp.reasoning}`);
        console.log(`   Best for: ${comp.strengths[0]}`);
      });
  } catch (error) {
    console.error('Failed to compare personas:', error);
  }
}

/**
 * Example 4: Using the REST API directly
 */
async function useRestAPI() {
  console.log('\n\n🌐 Example 4: Using REST API Endpoints\n');

  try {
    // Get all personas
    console.log('Fetching all personas...');
    const personasResponse = await fetch(`${API_BASE_URL}/personas`);
    const personas = await personasResponse.json();

    console.log(`Found ${personas.length} personas:`);
    personas.forEach(p => {
      console.log(`  - ${p.id}: ${p.name} (${p.role})`);
    });

    // Get specific persona details
    console.log('\n\nFetching architect persona details...');
    const architectResponse = await fetch(`${API_BASE_URL}/personas/architect`);
    const architect = await architectResponse.json();

    console.log(`\n${architect.name}:`);
    console.log(`Role: ${architect.role}`);
    console.log(`Description: ${architect.description}`);
    console.log(`Expertise: ${architect.expertise.slice(0, 3).join(', ')}...`);

    // Get recommendations via REST
    console.log('\n\nGetting recommendations via REST API...');
    const recommendResponse = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'implement caching strategy',
        limit: 2,
      }),
    });

    const recommendations = await recommendResponse.json();
    console.log('\nRecommendations for "implement caching strategy":');
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec.persona.name} - ${rec.reason}`);
    });
  } catch (error) {
    console.error('REST API error:', error);
  }
}

/**
 * Example 5: Get system statistics
 */
async function getSystemStats() {
  console.log('\n\n📊 Example 5: System Statistics\n');

  try {
    const result = await callMCPTool('get-recommendation-stats', {});
    const stats = result.data;

    console.log(`Total Personas: ${stats.totalPersonas}`);
    console.log(`Available Roles: ${stats.availableRoles.join(', ')}`);
    console.log('\nScoring Weights:');
    Object.entries(stats.scoringWeights).forEach(([key, value]) => {
      console.log(`  ${key}: ${(value * 100).toFixed(0)}%`);
    });
    console.log(`\nSystem Version: ${stats.systemInfo.version}`);
    console.log(`Features: ${stats.systemInfo.features.join(', ')}`);
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🚀 Personas MCP Server - JavaScript Client Examples\n');
  console.log('Make sure the server is running: npm start\n');
  console.log('='.repeat(50));

  try {
    await getRecommendations();
    await explainPersonaFit();
    await comparePersonas();
    await useRestAPI();
    await getSystemStats();

    console.log('\n\n✅ All examples completed successfully!');
    console.log('\nNext steps:');
    console.log('  - Try modifying the task descriptions');
    console.log('  - Create your own persona comparisons');
    console.log('  - Integrate into your applications');
  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
    console.error(
      'Make sure the Personas MCP Server is running on http://localhost:3000'
    );
  }
}

// Run the examples
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  callMCPTool,
  MCP_SERVER_URL,
  API_BASE_URL,
};
