#!/usr/bin/env node
import { EnhancedPersonaManager } from '../src/enhanced-persona-manager.js';
import { RecommendationEngine } from '../src/recommendation/recommendation-engine.js';
import { TaskDescription } from '../src/types/recommendation.js';

async function demonstrateRecommendationSystem() {
  // Initialize the persona manager
  const personaManager = new EnhancedPersonaManager();
  await personaManager.initialize();

  // Create recommendation engine
  const engine = new RecommendationEngine(personaManager);

  console.log('🤖 Persona Recommendation System Demo\n');

  // Example 1: Architecture Task
  console.log('📐 Architecture Task Example:');
  const architectureTask: TaskDescription = {
    title: 'Design microservices architecture',
    description:
      'Design a scalable microservices architecture for an e-commerce platform with high availability requirements',
    keywords: [
      'microservices',
      'architecture',
      'scalability',
      'high availability',
    ],
    complexity: 'complex',
    domain: 'backend',
  };

  const archRecommendations = await engine.getQuickRecommendation(
    architectureTask.title,
    architectureTask.description,
    { maxRecommendations: 3, keywords: architectureTask.keywords }
  );

  archRecommendations.forEach((rec, i) => {
    console.log(
      `  ${i + 1}. ${rec.personaId} (${Math.round(rec.score * 100)}%)`
    );
    console.log(`     Reasoning: ${rec.reasoning}`);
    console.log(`     Strengths: ${rec.strengths.join(', ')}`);
    if (rec.limitations && rec.limitations.length > 0) {
      console.log(`     Limitations: ${rec.limitations.join(', ')}`);
    }
    console.log();
  });

  // Example 2: Development Task
  console.log('💻 Development Task Example:');
  const devTask: TaskDescription = {
    title: 'Implement authentication system',
    description:
      'Build a secure JWT-based authentication system with password hashing and session management',
    keywords: ['authentication', 'jwt', 'security', 'implementation'],
    complexity: 'moderate',
    domain: 'backend',
  };

  const devRecommendations = await engine.getQuickRecommendation(
    devTask.title,
    devTask.description,
    { maxRecommendations: 2, keywords: devTask.keywords }
  );

  devRecommendations.forEach((rec, i) => {
    console.log(
      `  ${i + 1}. ${rec.personaId} (${Math.round(rec.score * 100)}%)`
    );
    console.log(`     Reasoning: ${rec.reasoning}`);
    console.log(`     Strengths: ${rec.strengths.join(', ')}`);
    console.log();
  });

  // Example 3: Debugging Task
  console.log('🐛 Debugging Task Example:');
  const debugTask: TaskDescription = {
    title: 'Fix memory leak in Node.js app',
    description:
      'Investigate and resolve memory leaks causing application crashes in production',
    keywords: ['debugging', 'memory leak', 'node.js', 'production'],
    complexity: 'complex',
    urgency: 'high',
  };

  const debugRecommendations = await engine.getQuickRecommendation(
    debugTask.title,
    debugTask.description,
    { maxRecommendations: 1, keywords: debugTask.keywords }
  );

  debugRecommendations.forEach((rec, i) => {
    console.log(
      `  ${i + 1}. ${rec.personaId} (${Math.round(rec.score * 100)}%)`
    );
    console.log(`     Reasoning: ${rec.reasoning}`);
    console.log(`     Strengths: ${rec.strengths.join(', ')}`);
    console.log();
  });

  // Example 4: Compare Personas
  console.log('⚖️  Persona Comparison Example:');
  const comparisonTask: TaskDescription = {
    title: 'API design and implementation',
    description: 'Design and implement RESTful APIs for a new service',
    complexity: 'moderate',
  };

  const comparisons = await engine.comparePersonas(
    ['architect', 'developer', 'reviewer'],
    comparisonTask
  );

  console.log('  Comparing personas for API design task:');
  comparisons.forEach((comp, i) => {
    console.log(
      `    ${i + 1}. ${comp.personaId}: ${Math.round(comp.score * 100)}%`
    );
    console.log(`       ${comp.reasoning}`);
  });
  console.log();

  // Example 5: System Stats
  console.log('📊 System Statistics:');
  const stats = engine.getSystemStats();
  console.log(`  Total Personas: ${stats.totalPersonas}`);
  console.log(`  Available Roles: ${stats.availableRoles.join(', ')}`);
  console.log(`  Scoring Weights:`);
  Object.entries(stats.scoringWeights).forEach(([key, value]) => {
    console.log(`    ${key}: ${(value * 100).toFixed(1)}%`);
  });

  console.log('\n✅ Demo completed successfully!');
  console.log('\nTry using the MCP tools in your Claude client:');
  console.log('- recommend-persona: Get persona recommendations for tasks');
  console.log('- explain-persona-fit: Understand why a persona fits a task');
  console.log(
    '- compare-personas: Compare multiple personas for the same task'
  );
  console.log('- get-recommendation-stats: Get system statistics');
}

// Run the demo
demonstrateRecommendationSystem().catch(console.error);
