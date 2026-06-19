# vNext Charter

Yutra is evolving from a Skill-based Agent Execution Runtime and Studio to an Agent Creation Layer.

Yutra vNext is an Agent Creation Layer:

```text
Archetype Library
+ Business Rule Configuration
+ Rule Compiler
+ Runtime
+ Trace / Audit / Certification
+ Creator Workbench
```

中文定位：Yutra vNext 是一套可治理智能体生产系统：客户选择智能体母型、配置业务规则、连接真实系统，即可生成可执行、可追踪、可审计、可持续优化的 Agent。

This is a vNext direction document. It does not claim that archetype-core, pack-config-core, or rule-compiler are implemented today.

## Why vNext

Phase 1 and Phase 2 established the execution foundation: DSL, Runtime, Trace, Governance, Certification, Skill, Studio, and Scenario Packs.

The next bottleneck is not execution. The next bottleneck is authoring.

If customers must understand Agent, Intent, State, Action, Guard, and Transition before they can configure a business agent, the creation layer is still too technical. vNext moves the primary customer interface up one level:

```text
Customers configure business rules.
Yutra generates DSL and execution assets.
Runtime still executes canonical IR.
```

DSL remains important, but it becomes the intermediate layer behind the creation workflow rather than the primary customer-facing interface.

## Archetype System Layers

The vNext archetype system has three layers:

1. Behavior Primitives
2. Product Archetypes
3. Scenario Patterns

Creator Workbench should primarily present Product Archetypes and Scenario Patterns to users. The Primitive layer is mainly for compiler, runtime, trace, and policy implementation.

This separation prevents Yutra from turning every business scenario into a new archetype ID. See [Archetype Taxonomy](archetype-taxonomy.md).

## Core Formula

```text
Agent = Archetype × Business Rule Config × Adapter × Policy × Runtime Trace
```

- Archetype defines the business action structure.
- Business Rule Config captures customer SOP and decision rules.
- Adapter connects customer systems without hard-coding them into runtime.
- Policy governs allow / deny / handoff / approval boundaries.
- Runtime Trace proves what happened and supports audit/certification.

## Data Chain

```text
Natural Requirement
-> AI Draft Config
-> Pack Config JSON
-> Rule Compiler
-> DSL / Policy / Templates / Test Cases
-> Canonical IR
-> Runtime
-> Trace / Audit / Certification
```

The key discipline is that AI can draft configuration, but deterministic modules compile and execute it.

## Product Discipline

1. Frontstage simple, backstage strict.
2. Customers configure business rules; the system generates DSL.
3. Any Agent must support Run Preview, Trace, and Audit. It must not rely on prompt trust alone.

## Non-goals

Yutra vNext is not:

- a generalized visual workflow platform
- a drag-and-drop canvas-first product
- a multi-tenant SaaS backend
- a complex permission/RBAC platform
- a marketplace
- a remote registry
- a system that clones hard-coded customer packs for every project
- a flow where LLM directly generates unaudited execution and immediately runs it

## Current vs vNext

Current Yutra provides the execution and builder foundation.

vNext adds a creation layer above the current foundation:

```text
Creator Workbench
-> Archetype selection
-> Business Rule Config
-> Rule Compiler
-> Generated Yutra assets
-> Existing Runtime / Trace / Audit / Certification
```

The existing runtime remains execution-first. LLM output must pass through configuration, compilation, validation, and preview before execution.
