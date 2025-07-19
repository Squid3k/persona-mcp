# Using Personas in Claude

This guide explains how to effectively use personas once the Personas MCP Server is connected to Claude Desktop.

## Table of Contents

- [Getting Started](#getting-started)
- [Adopting a Persona](#adopting-a-persona)
- [Getting Recommendations](#getting-persona-recommendations)
- [Comparing Personas](#comparing-personas)
- [Available Personas](#available-personas)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Getting Started

Once the Personas MCP server is connected to Claude (see the [Claude Integration Guide](./claude-integration.md)), you can interact with personas in several ways.

### Quick Check

Verify personas are available:

```
Please show me the available persona resources.
```

Claude will list all available personas with their IDs and descriptions.

## Adopting a Persona

### Basic Adoption

Use natural language to adopt a persona:

```
Please adopt the architect persona for this conversation.
```

Or more formally:

```
@adopt-persona-architect
```

### With Context

Provide specific context for better persona alignment:

```
Please adopt the debugger persona to help me troubleshoot a memory leak in my Node.js application.
```

### Persona Response

When Claude adopts a persona, it will:

1. Confirm the persona adoption
2. Briefly explain its approach and expertise
3. Ask clarifying questions if needed
4. Maintain that perspective throughout the conversation

## Getting Persona Recommendations

### Basic Recommendation

Ask for persona suggestions for your task:

```
Which persona would be best for designing a microservices architecture?
```

### Using the Recommendation Tool

For more detailed analysis:

```
@recommend-persona "I need help debugging a memory leak in my Node.js application"
```

The recommendation system will:

- Analyze your request
- Score each persona based on relevance
- Return top matches with explanations
- Include confidence scores

### Recommendation Response Format

```
Top recommendations:
1. **Debugger** (Score: 95/100)
   - Strengths: Systematic debugging, memory profiling, Node.js expertise
   - Why: Specialized in troubleshooting and root cause analysis

2. **Performance Analyst** (Score: 87/100)
   - Strengths: Performance profiling, bottleneck identification
   - Why: Expert in memory optimization and performance tuning

3. **Developer** (Score: 72/100)
   - Strengths: General Node.js knowledge, best practices
   - Why: Can provide implementation fixes
```

## Comparing Personas

### Side-by-Side Comparison

Compare personas for a specific task:

```
@compare-personas architect developer "for designing a new REST API"
```

### Comparison Output

The comparison will show:

- Strengths of each persona for the task
- Different approaches they would take
- When to choose one over the other
- Complementary aspects

Example output:

```
Comparing for "designing a new REST API":

**Architect**:
- Focus: High-level design, scalability, API standards
- Approach: Start with API contracts, consider future growth
- Best for: Large-scale systems, long-term planning

**Developer**:
- Focus: Implementation details, practical concerns
- Approach: Start with working code, iterate on design
- Best for: Rapid prototyping, immediate needs

Recommendation: Start with Architect for design, switch to Developer for implementation
```

## Available Personas

### Core Personas

1. **Architect** (`architect`)
   - System design and high-level architecture
   - Scalability patterns and best practices
   - Technology selection and trade-offs

2. **Developer** (`developer`)
   - Code implementation and best practices
   - Clean code principles
   - Practical problem-solving

3. **Reviewer** (`reviewer`)
   - Code quality analysis
   - Security review
   - Performance optimization suggestions

4. **Debugger** (`debugger`)
   - Systematic troubleshooting
   - Root cause analysis
   - Debugging strategies

5. **Product Manager** (`product-manager`)
   - Requirements gathering
   - User story creation
   - Feature prioritization

6. **Technical Writer** (`technical-writer`)
   - Documentation creation
   - API documentation
   - Technical communication

### Specialized Personas

7. **Engineering Manager** (`engineering-manager`)
   - Team leadership
   - Project management
   - Technical strategy

8. **Optimizer** (`optimizer`)
   - Performance tuning
   - Resource optimization
   - Efficiency improvements

9. **Security Analyst** (`security-analyst`)
   - Security assessment
   - Threat modeling
   - Vulnerability analysis

10. **Tester** (`tester`)
    - Test strategy
    - Quality assurance
    - Test automation

11. **UI Designer** (`ui-designer`)
    - User interface design
    - User experience
    - Accessibility

12. **Performance Analyst** (`performance-analyst`)
    - Performance monitoring
    - Bottleneck identification
    - Optimization strategies

## Best Practices

### 1. Choose the Right Persona

- **For planning**: Use Architect or Product Manager
- **For implementation**: Use Developer or specific technology expert
- **For review**: Use Reviewer or Security Analyst
- **For problems**: Use Debugger or Performance Analyst
- **For documentation**: Use Technical Writer

### 2. Provide Context

Good:

```
Adopt the architect persona to help design a real-time chat system that needs to handle 10,000 concurrent users.
```

Less effective:

```
Adopt the architect persona.
```

### 3. Switch Personas as Needed

```
// Start with architecture
Please adopt the architect persona to design the system.

// Later, switch for implementation
Now please adopt the developer persona to implement the user service.

// Finally, review
Please adopt the reviewer persona to check this code for security issues.
```

### 4. Combine Personas

Get multiple perspectives:

```
Can you first analyze this as an architect, then provide the developer's perspective?
```

### 5. Use Personas for Learning

```
As a technical writer, can you explain how OAuth works in simple terms?
```

## Automatic Persona Selection

### Configuring Your AI Assistant

You can configure your AI assistant to automatically select appropriate personas by adding instructions to your project's AI configuration files:

1. **CLAUDE.md** - For Claude/Claude Code
2. **CURSOR.md** - For Cursor IDE
3. **.github/copilot-instructions.md** - For GitHub Copilot

Example instruction:

```
When working on tasks in this project, automatically use the Personas MCP server to:
1. Analyze the task type
2. Get persona recommendations using @recommend-persona
3. Adopt the most suitable persona
4. Explain the selection to the user
```

### Benefits of Automatic Selection

- **Seamless Experience**: No need to manually request personas
- **Optimal Expertise**: Always get the right perspective
- **Consistent Approach**: Same persona selection logic across team
- **Time Saving**: Skip the decision-making process

### How It Works

When configured, your AI assistant will:

1. **Analyze** your request to identify the task type
2. **Query** the recommendation system for the best persona
3. **Adopt** the highest-scoring persona automatically
4. **Inform** you which persona was selected and why
5. **Proceed** with the task from that perspective

### Example Automatic Selections

- "Why is my app crashing?" → Debugger persona
- "Design a REST API" → Architect persona
- "Review this code" → Reviewer persona
- "Write tests for this" → Tester persona
- "Optimize this query" → Performance Analyst persona

For detailed configuration instructions, see the [AI Assistant Configuration Guide](./ai-assistant-configuration.md).

## Advanced Usage

### Chaining Personas

For complex projects, chain personas:

1. **Product Manager**: Define requirements
2. **Architect**: Design the system
3. **Developer**: Implement features
4. **Reviewer**: Ensure quality
5. **Technical Writer**: Document the solution

### Custom Context

Provide detailed context for specialized help:

```
Please adopt the performance analyst persona. Context:
- Node.js application
- 50% increase in response time over last week
- No code changes deployed
- Running on AWS ECS
- Using PostgreSQL database
```

### Persona Memory

Personas maintain context within a conversation:

```
As the architect, what are the main components?
// Claude responds with architectural components

What about data flow between them?
// Claude continues as architect, building on previous response
```

### Team Simulation

Simulate team discussions:

```
I'd like to hear different perspectives on using microservices:
1. What would the architect say?
2. What concerns would the security analyst raise?
3. How would the engineering manager evaluate the proposal?
```

## Common Scenarios

### Scenario 1: Starting a New Project

```
1. "Please recommend a persona for planning a new e-commerce platform"
2. "Adopt the product manager persona to define requirements"
3. "Now as an architect, design the high-level system"
4. "Switch to developer persona for implementation guidance"
```

### Scenario 2: Debugging Production Issues

```
1. "Adopt the debugger persona - our API is returning 500 errors intermittently"
2. "What monitoring would the performance analyst recommend?"
3. "As a reviewer, what could be causing this in the code?"
```

### Scenario 3: Code Review

```
1. "Please adopt the reviewer persona to review this pull request"
2. "Now check it from a security analyst perspective"
3. "Finally, as a technical writer, is the documentation adequate?"
```

## Tips and Tricks

1. **Be Specific**: The more context you provide, the better the persona can help
2. **Ask for Rationale**: "Why would the architect choose this approach?"
3. **Request Examples**: "Can you show me a code example as the developer?"
4. **Iterate**: "That's helpful, but what about handling errors?"
5. **Learn Persona Strengths**: Each persona has unique expertise - leverage it

## Next Steps

- Explore [creating custom personas](./creating-personas.md) for your specific needs
- Check the [API Reference](../engineering/api-reference.md) for programmatic access
- See [examples](../../examples/) for integration patterns
