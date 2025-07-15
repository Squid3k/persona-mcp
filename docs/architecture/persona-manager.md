# Persona Manager Architecture

## Overview

The Enhanced Persona Manager is the core component responsible for loading, managing, and providing access to personas. It supports multiple persona sources with precedence rules and hot-reloading capabilities.

## Component Architecture

```mermaid
classDiagram
    class EnhancedPersonaManager {
        -loaders: PersonaLoader[]
        -personaMap: Map<string, LoadedPersona>
        -config: PersonaConfig
        +initialize(): Promise<void>
        +getAllPersonas(): Persona[]
        +getPersona(id: string): Persona
        +getPersonaInfo(): PersonaInfo
        +generatePrompt(persona, context): string
        +shutdown(): Promise<void>
    }
    
    class PersonaLoader {
        -resolver: PersonaResolver
        -watcher: PersonaWatcher
        +loadPersonas(): Promise<LoadResult>
        +startWatching(callback): void
        +stopWatching(): void
    }
    
    class PersonaResolver {
        -sourcePaths: string[]
        +resolvePersonas(): Promise<ResolvedPersona[]>
        -loadYamlPersona(path): Promise<YamlPersona>
        -validatePersona(data): ValidationResult
    }
    
    class PersonaWatcher {
        -watchers: FSWatcher[]
        +watch(paths, callback): void
        +unwatch(): void
    }
    
    EnhancedPersonaManager --> PersonaLoader
    PersonaLoader --> PersonaResolver
    PersonaLoader --> PersonaWatcher
```

## Data Flow

```mermaid
flowchart TB
    subgraph "Initialization"
        Start[Manager.initialize] --> CreateLoaders[Create Loaders]
        CreateLoaders --> LoadDefault[Load Default Personas]
        CreateLoaders --> LoadUser[Load User Personas]
        CreateLoaders --> LoadProject[Load Project Personas]
    end
    
    subgraph "Loading Process"
        LoadDefault --> Resolver1[Resolver]
        LoadUser --> Resolver2[Resolver]
        LoadProject --> Resolver3[Resolver]
        
        Resolver1 --> Validate1[Validate]
        Resolver2 --> Validate2[Validate]
        Resolver3 --> Validate3[Validate]
        
        Validate1 --> Store[PersonaMap]
        Validate2 --> Store
        Validate3 --> Store
    end
    
    subgraph "Conflict Resolution"
        Store --> Conflicts{Conflicts?}
        Conflicts -->|Yes| Precedence[Apply Precedence]
        Conflicts -->|No| Ready[Ready]
        Precedence --> Ready
    end
```

## Persona Loading Strategy

### Source Precedence
```mermaid
graph LR
    Default[Default Personas] --> User[User Personas]
    User --> Project[Project Personas]
    
    style Default fill:#f9f,stroke:#333,stroke-width:2px
    style User fill:#bbf,stroke:#333,stroke-width:2px
    style Project fill:#bfb,stroke:#333,stroke-width:2px
```

**Precedence Rules**:
1. Project personas (highest priority)
2. User personas
3. Default personas (lowest priority)

### Loading Sequence

```mermaid
sequenceDiagram
    participant PM as PersonaManager
    participant PL as PersonaLoader
    participant PR as PersonaResolver
    participant FS as FileSystem
    
    PM->>PL: loadPersonas()
    PL->>PR: resolvePersonas()
    
    loop For each source path
        PR->>FS: readdir(path)
        FS-->>PR: YAML files
        PR->>FS: readFile(yaml)
        FS-->>PR: Content
        PR->>PR: parseYAML()
        PR->>PR: validatePersona()
    end
    
    PR-->>PL: ResolvedPersonas[]
    PL->>PL: Process conflicts
    PL-->>PM: LoadResult
    PM->>PM: Update personaMap
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    Uninitialized --> Initializing: initialize()
    Initializing --> Loading: Load personas
    Loading --> Validating: Validate personas
    Validating --> Resolving: Resolve conflicts
    Resolving --> Ready: All loaded
    Ready --> Watching: Start file watchers
    Watching --> Reloading: File change detected
    Reloading --> Validating
    Watching --> ShuttingDown: shutdown()
    ShuttingDown --> [*]
```

## File Watching Architecture

```mermaid
graph TB
    subgraph "File System Events"
        Create[File Created]
        Modify[File Modified]
        Delete[File Deleted]
    end
    
    subgraph "Watcher"
        FSWatcher[FS Watcher]
        Debounce[Debounce Handler]
    end
    
    subgraph "Reload Process"
        Reload[Reload Personas]
        Validate[Validate Changes]
        Update[Update Map]
        Notify[Notify Changes]
    end
    
    Create --> FSWatcher
    Modify --> FSWatcher
    Delete --> FSWatcher
    
    FSWatcher --> Debounce
    Debounce --> Reload
    Reload --> Validate
    Validate --> Update
    Update --> Notify
```

## Data Structures

### Persona Map Structure
```mermaid
graph TB
    subgraph "PersonaMap"
        Map[Map<string, LoadedPersona>]
    end
    
    subgraph "LoadedPersona"
        Persona[Persona Data]
        Source[Source Path]
        LoadTime[Load Timestamp]
        Validation[Validation Status]
    end
    
    Map --> LoadedPersona
    LoadedPersona --> Persona
    LoadedPersona --> Source
    LoadedPersona --> LoadTime
    LoadedPersona --> Validation
```

### Validation Flow
```mermaid
flowchart LR
    subgraph "Validation Steps"
        Schema[Schema Validation]
        Required[Required Fields]
        Types[Type Checking]
        Values[Value Constraints]
    end
    
    subgraph "Results"
        Valid[Valid Persona]
        Invalid[Invalid + Errors]
    end
    
    Schema --> Required
    Required --> Types
    Types --> Values
    Values --> Valid
    Values --> Invalid
```

## Error Handling

```mermaid
graph TB
    subgraph "Error Types"
        LoadError[Load Error]
        ParseError[Parse Error]
        ValidationError[Validation Error]
        ConflictError[Conflict Error]
    end
    
    subgraph "Error Handling"
        Log[Log Error]
        Store[Store Invalid]
        Continue[Continue Loading]
        Report[Report Status]
    end
    
    LoadError --> Log
    ParseError --> Log
    ValidationError --> Store
    ConflictError --> Log
    
    Log --> Continue
    Store --> Continue
    Continue --> Report
```

## Performance Optimizations

### Caching Strategy
```mermaid
graph TB
    Request[Persona Request] --> Cache{In Cache?}
    Cache -->|Yes| Return[Return Cached]
    Cache -->|No| Load[Load from Source]
    Load --> Validate[Validate]
    Validate --> StoreCache[Store in Cache]
    StoreCache --> Return
```

### Lazy Loading
```mermaid
graph LR
    GetPersona[getPersona(id)] --> Check{Loaded?}
    Check -->|Yes| Return[Return Persona]
    Check -->|No| LoadSingle[Load Single Persona]
    LoadSingle --> Cache[Cache Result]
    Cache --> Return
```

## Integration Points

### With Recommendation Engine
```mermaid
graph TB
    RE[RecommendationEngine] --> PM[PersonaManager]
    PM --> GetAll[getAllPersonas()]
    PM --> GetOne[getPersona(id)]
    GetAll --> Personas[Persona Array]
    GetOne --> Persona[Single Persona]
    Personas --> RE
    Persona --> RE
```

### With MCP Server
```mermaid
graph TB
    Server[MCP Server] --> PM[PersonaManager]
    PM --> Resources[Resource List]
    PM --> Prompts[Prompt Generation]
    Resources --> Server
    Prompts --> Server
```

## Configuration

### Default Configuration
```typescript
interface PersonaConfig {
  defaultPersonasPath: string;
  userPersonasPath: string;
  projectPersonasPath: string;
  watchForChanges: boolean;
  validationMode: 'strict' | 'loose';
  conflictResolution: 'override' | 'merge';
}
```

### Environment Variables
- `PERSONAS_PATH`: Override default paths
- `PERSONAS_WATCH`: Enable/disable watching
- `PERSONAS_VALIDATION`: Validation mode

## Future Enhancements

1. **Database Backend**: Store personas in database
2. **Remote Loading**: Load personas from URLs
3. **Versioning**: Support persona versions
4. **Caching Layer**: Redis/Memcached integration
5. **Event System**: Emit events on changes