# Configuration Architecture

* **Status:** Accepted
* **Date:** 2026-09-19
* **Decision Owners:** Project Architecture
* **Scope:** API Core / Execution Infrastructure

---

## Context

The application requires configuration across infrastructure, business capabilities, adapters, and other runtime dependencies.

Without an explicit configuration architecture, configuration can become a hidden dependency and environment-specific concerns can leak across architectural boundaries.

The architecture therefore requires an explicit model defining:

* how configuration is sourced
* how configuration is loaded
* how configuration is normalized and validated
* who owns configuration
* how configuration is distributed
* whether configuration can change at runtime
* how sensitive configuration and secrets are handled

Configuration must also remain separate from Execution Context. Execution Context represents execution-specific runtime state and must not become a configuration carrier.

The configuration architecture must remain independent of specific configuration libraries, secret-management providers, deployment platforms, and environment-management mechanisms.

---

## Decision

Application configuration is owned by the **Application** layer and is supplied to runtime dependencies through the **Composition Root**.

Configuration follows this lifecycle:

```text
Configuration Sources
        ↓
      Load
        ↓
      Parse
        ↓
    Normalize
        ↓
     Validate
        ↓
Immutable Configuration
        ↓
 Composition Root
        ↓
Runtime Dependencies
```

Configuration is treated as startup input rather than mutable runtime state.

The Composition Root is responsible for projecting application configuration into the specific configuration required by each dependency.

Components must not receive the entire application configuration when only a subset is required.

---

## Configuration Sources

Configuration may originate from external sources such as:

* Environment variables
* Configuration files
* Container or deployment configuration
* Secret stores
* Cloud configuration services
* Command-line arguments
* Other external configuration mechanisms

The architecture does not mandate a specific configuration source or configuration library.

Configuration sources are external inputs to the application configuration boundary.

When multiple configuration sources are used, their precedence must be deterministic and explicitly defined by the implementation before configuration validation.

All configuration sources must converge into the application configuration boundary before application composition.

Business modules must never access configuration sources directly.

---

## Configuration Loading and Validation

Configuration is loaded during application startup.

Raw configuration values may require parsing and normalization before validation.

The configuration lifecycle is:

```text
Load
  ↓
Parse
  ↓
Normalize
  ↓
Validate
  ↓
Freeze
  ↓
Compose
```

Validation is responsible for establishing that the resulting application configuration satisfies its required contract.

Validation may include:

* Required values
* Value types
* Allowed values
* Structural relationships
* Environment-specific requirements
* Security-sensitive configuration requirements

Invalid required configuration must prevent the application from entering its normal runtime state.

Configuration validation is distinct from infrastructure connectivity.

For example:

```text
DATABASE_URL is missing
```

is a configuration validation failure.

Whereas:

```text
Database cannot be reached
```

is an infrastructure initialization or connectivity failure.

These concerns must remain separately owned.

---

## Configuration Ownership

The Application layer owns application-wide configuration.

The Composition Root controls how configuration is distributed during application composition.

Configuration must not be exposed through an arbitrary global configuration mechanism.

The Composition Root projects configuration according to dependency ownership.

Examples include:

```text
Application
    │
    └── Composition Root
            │
            ├── Infrastructure
            │      └── Infrastructure configuration
            │
            ├── Business Modules
            │      └── Required business-level configuration
            │
            ├── Adapters
            │      └── Transport-specific configuration
            │
            └── Plugins
                   └── Configuration required by their contract
```

A component may receive configuration only for responsibilities it owns or directly performs.

Infrastructure configuration must not leak into business modules.

For example, a business module should not receive database connection strings, cache URLs, provider credentials, or deployment-specific settings merely because those values exist in application configuration.

---

## Configuration Immutability

Validated application configuration is immutable for the lifetime of an application instance.

Once application startup has completed, configuration must not be mutated through runtime operations such as configuration updates, overrides, or reloads.

Configuration changes require a new application initialization cycle.

Conceptually:

```text
Configuration Change
        ↓
New Application Initialization
        ↓
New Immutable Configuration
        ↓
New Application Instance
```

Runtime state is separate from configuration.

Runtime state may include:

* Active connections
* Cache contents
* Queue state
* Request state
* Execution Context
* Metrics
* Other operational state

Runtime state may change during application execution according to its ownership and lifecycle.

Configuration does not.

---

## Secrets and Sensitive Configuration

Secrets are a subset of sensitive application configuration.

Examples include:

* Database credentials
* Authentication secrets
* API keys
* Encryption keys
* External service credentials

Secrets follow the same configuration lifecycle as other configuration but require stricter handling.

Secrets must:

* Be distributed only to dependencies that require them
* Never be exposed through logs
* Never be exposed through error messages
* Never be returned through API responses
* Never be included in metrics
* Never be included in tracing metadata
* Never be included in diagnostic output
* Never be included in configuration dumps or serialization
* Never be stored in Execution Context
* Never be available through arbitrary global configuration access

Configuration validation may identify a missing or invalid secret, but validation errors must never expose the secret value itself.

Secret-management providers are infrastructure and deployment concerns.

Business modules must not directly access secret stores or secret-management providers.

---

## Secret Rotation

The configuration architecture does not require runtime mutation of secrets.

Because application configuration is immutable, a changed secret is applied through a new application initialization cycle.

Zero-downtime or runtime secret rotation, if required in the future, must be addressed through a separate architectural decision rather than by making the existing application configuration mutable.

---

## Consequences

### Positive Consequences

* Configuration dependencies become explicit.
* Configuration ownership remains unambiguous.
* Business modules remain independent of environment and deployment mechanisms.
* Configuration sources can be replaced without changing business capabilities.
* Invalid required configuration fails before normal runtime execution.
* Runtime behavior is more deterministic because configuration cannot silently change.
* Components receive only the configuration required for their responsibilities.
* Secret handling becomes an explicit architectural concern.
* Execution Context remains independent from configuration.
* Dependencies can be tested with explicitly supplied configuration.
* The architecture remains independent of specific configuration libraries and secret providers.

### Trade-offs

* Configuration loading and validation become centralized Application responsibilities.
* The Composition Root becomes responsible for deliberate configuration projection.
* Components cannot arbitrarily retrieve configuration at runtime.
* Runtime configuration mutation is intentionally not supported.
* Dynamic configuration or zero-downtime secret rotation requires a separate architectural design.

---

## Architectural Invariants

The following invariants are mandatory:

### Invariant 1 — Application Owns Configuration

Application configuration is owned by the Application layer.

No other architectural component owns the overall application configuration.

---

### Invariant 2 — Configuration Is Validated Before Composition

Required configuration must be loaded, normalized, and validated before application composition begins.

---

### Invariant 3 — Configuration Is Immutable After Startup

Validated application configuration is immutable for the lifetime of an application instance.

---

### Invariant 4 — Components Receive Only Required Configuration

A component may receive configuration only for responsibilities it owns or directly performs.

---

### Invariant 5 — Business Modules Cannot Access Configuration Sources

Business modules must not directly access environment variables, configuration files, secret stores, deployment configuration, or other configuration sources.

---

### Invariant 6 — Infrastructure Configuration Does Not Leak Into Business Modules

Infrastructure-specific configuration must remain outside business capabilities unless it is explicitly part of a business-level contract.

---

### Invariant 7 — Secrets Receive Stricter Handling

Secret values must never be exposed through logs, errors, responses, metrics, traces, diagnostics, serialization, or other observable application output.

---

### Invariant 8 — Execution Context Does Not Carry Configuration

Execution Context must not be used to store or propagate application configuration or secrets.

---

### Invariant 9 — Configuration Sources Are Replaceable

No architectural component outside the configuration boundary may depend on a specific configuration source or secret-management provider.

---

### Invariant 10 — No Arbitrary Global Configuration Access

The architecture must not provide unrestricted global access to application configuration or secrets.

---

### Invariant 11 — Configuration Changes Require a New Initialization Cycle

Changes to immutable application configuration require a new application initialization cycle rather than mutation of a running configuration instance.

---

### Invariant 12 — Configuration Validation Is Separate From Infrastructure Connectivity

Configuration validity and infrastructure connectivity are distinct concerns with separate ownership and lifecycle.

---

## Alternatives Considered

### Global Configuration Singleton

Rejected because it creates hidden dependencies and permits arbitrary access to application configuration.

### Passing the Entire Configuration Object Everywhere

Rejected because components receive unrelated configuration and dependency boundaries become less explicit.

### Business Modules Reading Environment Variables Directly

Rejected because this couples business capabilities to deployment and environment mechanisms.

### Runtime Mutable Configuration

Rejected because it weakens deterministic runtime behavior and conflicts with immutable application configuration.

### Business Modules Accessing Secret Providers Directly

Rejected because it couples business capabilities to infrastructure and provider-specific concerns.

### Configuration Provider Abstractions Inside Every Module

Rejected because this introduces unnecessary abstraction and moves configuration ownership away from the Application and Composition Root.

---

## Relationship to the Architecture

This decision implements the following architectural principles:

* Explicit Composition
* Explicit Dependencies
* Technology Independence
* Replaceability Through Composition
* Explicit Over Magic
* Framework Independence

The configuration architecture is implemented through the existing Composition Root and does not introduce a separate configuration framework into the architecture.

The relationship remains:

```text
Application Configuration
          ↓
    Composition Root
          ↓
Explicit Dependency Graph
          ↓
Runtime Application
```

The configuration architecture complements the Composition-First Modular Monolith architecture and must not introduce dependencies that violate the architectural invariants defined in `ARCHITECTURE.md`.

---

## Related Decisions

* Composition Root
* Execution Context
* Error Architecture
* Dependency Ownership

---

## Decision Summary

The application loads and validates configuration during startup.

The Application layer owns configuration.

The Composition Root distributes only the configuration required by each dependency.

Validated configuration is immutable for the lifetime of an application instance.

Configuration sources and secret-management mechanisms remain outside business modules.

Secrets receive stricter handling and must never become part of Execution Context or observable application output.

Configuration changes require a new application initialization cycle.

This provides explicit, predictable, technology-independent configuration without introducing unnecessary abstraction.
