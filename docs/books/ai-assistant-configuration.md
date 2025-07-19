# AI Assistant Configuration Guide

This guide explains how to configure various AI assistants to automatically select and adopt appropriate personas based on the task at hand.

## Table of Contents

- [Overview](#overview)
- [Benefits](#benefits)
- [Claude Configuration](#claude-configuration)
- [Cursor Configuration](#cursor-configuration)
- [GitHub Copilot Configuration](#github-copilot-configuration)
- [General Configuration Principles](#general-configuration-principles)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Automatic persona selection enables AI assistants to analyze each request and automatically adopt the most appropriate persona without manual intervention. This provides users with expert-level guidance from the right perspective every time.

## Benefits

### For Individual Developers

- **Seamless Experience**: No need to remember persona names or manually request them
- **Optimal Expertise**: Always get advice from the most suitable perspective
- **Learning**: Discover new personas through automatic adoption
- **Efficiency**: Start solving problems immediately with the right approach

### For Teams

- **Consistency**: All team members get the same persona selection logic
- **Onboarding**: New team members automatically benefit from expert perspectives
- **Standards**: Enforce architectural and coding standards through personas
- **Knowledge Sharing**: Capture team expertise in custom personas

## Claude Configuration

### Using CLAUDE.md

Add the following to your project's `CLAUDE.md` file:

```markdown
## Automatic Persona Selection

When the Personas MCP server is connected and available:

1. **Analyze** each user request to determine the task type:
   - Debugging/troubleshooting → Debugger persona
   - System design/architecture → Architect persona
   - Code implementation → Developer persona
   - Code review → Reviewer persona
   - Performance issues → Performance Analyst or Optimizer persona
   - Security concerns → Security Analyst persona
   - Testing → Tester persona
   - Documentation → Technical Writer persona
   - UI/UX → UI Designer persona
   - Team/process → Engineering Manager or Product Manager persona

2. **Get Recommendations** using the @recommend-persona tool with the user's request

3. **Adopt** the highest-scoring persona automatically

4. **Inform** the user briefly: "I've adopted the [persona name] persona for this [task type]"

5. **Proceed** with the task from that persona's perspective

### Example Interactions

- User: "Why is my app crashing after the latest deployment?"
  → Automatically adopt Debugger persona

- User: "How should I structure a microservices architecture?"
  → Automatically adopt Architect persona

- User: "Review this pull request for security issues"
  → Automatically adopt Security Analyst persona

### Exceptions

Do not automatically adopt personas when:
- The user explicitly requests a specific persona
- The user asks to compare personas
- The task is about persona management itself
```

### Global Claude Configuration

For all projects, add to `~/.claude/CLAUDE.md`:

```markdown
When working on software development tasks and the Personas MCP server is available,
automatically select appropriate personas based on the task type. Inform the user
which persona was selected and proceed with that perspective.
```

## Cursor Configuration

### Using CURSOR.md

Create a `CURSOR.md` file in your project root:

```markdown
## Cursor AI Assistant Configuration

### Automatic Persona Selection

When the Personas MCP server endpoint is available (http://localhost:3000):

1. For each significant task, make an API call to get persona recommendations:
   ```
   POST http://localhost:3000/api/recommend
   {
     "query": "[user's request]",
     "limit": 1
   }
   ```

2. Adopt the recommended persona's approach based on the response

3. Inform the user: "Approaching this as a [persona role]..."

### Task Mappings

- Bug fixes → Debugger approach
- New features → Developer + Architect approaches
- Refactoring → Reviewer + Optimizer approaches
- Documentation → Technical Writer approach
```

## GitHub Copilot Configuration

### Using copilot-instructions.md

Create `.github/copilot-instructions.md`:

```markdown
## Copilot Persona-Aware Assistance

When generating code or providing suggestions, consider the following personas
based on the context:

### Code Generation
- Use **Developer** persona principles:
  - Clean, maintainable code
  - Proper error handling
  - Clear naming conventions
  - SOLID principles

### Code Comments
- Use **Technical Writer** persona principles:
  - Clear, concise explanations
  - Why over what
  - Examples where helpful

### Test Generation
- Use **Tester** persona principles:
  - Edge cases
  - Happy and unhappy paths
  - Meaningful test names
  - Comprehensive coverage

### Performance Suggestions
- Use **Optimizer** persona principles:
  - Efficiency considerations
  - Resource usage
  - Algorithmic complexity
```

## General Configuration Principles

### 1. Task Analysis

Train your AI to recognize task types:

```markdown
Task Type Recognition:
- Keywords: "debug", "crash", "error", "not working" → Debugging task
- Keywords: "design", "structure", "architecture" → Architecture task
- Keywords: "implement", "create", "build" → Development task
- Keywords: "review", "check", "analyze" → Review task
- Keywords: "test", "verify", "validate" → Testing task
- Keywords: "document", "explain", "describe" → Documentation task
```

### 2. Contextual Adoption

Consider context beyond keywords:

```markdown
Context Analysis:
- File type: test files → Tester persona
- File type: README/docs → Technical Writer persona
- PR description → Reviewer persona
- Performance metrics → Performance Analyst persona
```

### 3. Graceful Degradation

Handle cases when the MCP server is unavailable:

```markdown
If Personas MCP server is unavailable:
- Still mention which perspective would be ideal
- Apply general best practices for that type of task
- Suggest connecting the MCP server for enhanced assistance
```

## Examples

### Example 1: Automatic Debugging Assistance

User input:
```
My Node.js app is consuming too much memory and eventually crashes
```

AI response with automatic persona:
```
I've adopted the Debugger persona for this memory issue. Let me help you troubleshoot systematically.

First, let's identify the memory leak pattern...
[Continues with debugger's systematic approach]
```

### Example 2: Architecture Guidance

User input:
```
I need to add real-time notifications to our web app
```

AI response with automatic persona:
```
I've adopted the Architect persona to design a scalable notification system.

Let's consider the architectural options...
[Continues with architect's high-level design approach]
```

### Example 3: Code Review

User input:
```
Can you check this authentication middleware for issues?
```

AI response with automatic persona:
```
I've adopted the Security Analyst persona to review your authentication middleware.

I'll examine this for security vulnerabilities...
[Continues with security-focused review]
```

## Best Practices

### 1. Clear Communication

Always inform users about persona adoption:

```markdown
✅ Good: "I've adopted the Architect persona to help design your API"
❌ Bad: [Silently adopting persona without notification]
```

### 2. Appropriate Selection

Match personas to tasks accurately:

```markdown
✅ Good: Debugger for troubleshooting, Architect for system design
❌ Bad: UI Designer for backend performance issues
```

### 3. Flexible Switching

Allow manual override:

```markdown
If user says: "Actually, can you look at this from a security perspective?"
Response: "Switching to the Security Analyst persona..."
```

### 4. Team Customization

For team-specific needs:

```markdown
## Team Personas

Our team uses these custom personas:
- "Frontend Specialist" for React/TypeScript tasks
- "Data Engineer" for ETL pipeline work
- "DevOps Expert" for infrastructure tasks

Automatically select these for relevant tasks.
```

## Troubleshooting

### Persona Not Being Selected

1. Check MCP server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Verify configuration file location and syntax

3. Ensure AI assistant has access to the configuration

### Wrong Persona Selected

1. Refine task type recognition rules
2. Add more specific keywords
3. Consider context beyond keywords

### Selection Too Frequent

Balance automatic selection:

```markdown
Only auto-select personas for:
- New conversations
- Significant topic changes
- Explicit task switches
```

### Performance Impact

For high-frequency selections:

```markdown
Cache persona selections for similar requests within the same conversation
to avoid repeated API calls.
```

## Next Steps

1. Start with basic automatic selection for clear task types
2. Gather feedback from usage
3. Refine selection logic based on your team's needs
4. Add custom personas for specialized domains
5. Share your configuration patterns with the community

---

For more information:
- [Using Personas Guide](./using-personas.md)
- [Creating Custom Personas](./creating-personas.md)
- [API Reference](../engineering/api-reference.md)