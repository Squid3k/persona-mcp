#!/bin/bash

# Script to help document personas consistently
# Usage: ./document-persona.sh <persona-name>

set -e

PERSONA_NAME=$1

if [ -z "$PERSONA_NAME" ]; then
    echo "Usage: $0 <persona-name>"
    echo "Example: $0 debugger"
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_FILE="$PROJECT_ROOT/src/personas/${PERSONA_NAME}.ts"
DOC_FILE="$PROJECT_ROOT/docs/personas/${PERSONA_NAME}.md"

if [ ! -f "$SRC_FILE" ]; then
    echo "Error: Source file not found: $SRC_FILE"
    exit 1
fi

echo "Processing $PERSONA_NAME persona..."
echo "Source: $SRC_FILE"
echo "Target: $DOC_FILE"

# Create a template that can be manually filled
cat > "$DOC_FILE.template" << 'EOF'
# [NAME] Persona

## Overview

- **ID**: `[ID]`
- **Name**: [NAME]
- **Role**: [ROLE]
- **Tags**: [TAGS]

## Core Purpose

### Identity
[IDENTITY]

### Primary Objective
[PRIMARY_OBJECTIVE]

## Expertise Areas

### Domains
[DOMAINS]

### Skills
[SKILLS]

## Working Style

### Mindset
[MINDSET]

### Methodology
[METHODOLOGY]

### Priorities
[PRIORITIES]

### Anti-Patterns to Avoid
[ANTI_PATTERNS]

## Constraints & Guidelines

### Must Do
[MUST_CONSTRAINTS]

### Never Do
[NEVER_CONSTRAINTS]

## Decision Framework

Key questions to guide [ROLE_LOWER] decisions:
[DECISION_CRITERIA]

## Examples

[EXAMPLES]

## Behavior Diagrams

[BEHAVIOR_DIAGRAMS]

## Full Persona Instructions

When adopting the [NAME] persona, internalize these instructions:

### Core Identity and Purpose
[FULL_IDENTITY]

### Operating Principles
[OPERATING_PRINCIPLES]

### Methodology Approach
[METHODOLOGY_NARRATIVE]

### Constraints and Rules
[CONSTRAINTS_NARRATIVE]

### Decision Framework
For every [ROLE_LOWER] decision, ask yourself:
[DECISION_CRITERIA]

### Areas of Focus
[EXPERTISE_NARRATIVE]

### Priority Hierarchy
[PRIORITIES_NUMBERED]

### Anti-Patterns to Avoid
[ANTI_PATTERNS]
EOF

echo ""
echo "Template created at: $DOC_FILE.template"
echo ""
echo "Next steps:"
echo "1. Open $SRC_FILE to see the persona data"
echo "2. Fill in the template at $DOC_FILE.template"
echo "3. Save as $DOC_FILE"
echo "4. Run: node scripts/validate-mermaid.js $DOC_FILE"
echo ""
echo "Key things to remember:"
echo "- Remove all indentation from Mermaid diagrams"
echo "- Add blank lines before and after code blocks"
echo "- For state diagrams with <<choice>>, ensure unique state names"