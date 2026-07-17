# Agent Archetype Library

An Agent Archetype is a reusable business action structure.

It is not an industry template. It is not a prebuilt customer-specific pack. It describes the shape of work an agent performs: collecting information, answering from knowledge, resolving requests, deciding approvals, diagnosing issues, orchestrating processes, producing content, analyzing data, engaging leads, or responding to monitoring signals.

Small numbers of archetypes can combine into many real agents because most business agents are compositions of repeatable action structures plus domain-specific rules, adapters, policies, and templates.

This document defines the vNext library direction. `@yutra/archetype-core` now provides the public base manifest and local registry model for these archetypes. It still does not implement Pack Config or Rule Compiler.

See [Archetype Core](archetype-core.md) for the TypeScript manifest, validation, registry, and explain API.

## Archetype Layering

The 10 main archetypes in this document are Product Archetypes, not Primitive behavior atoms.

Yutra separates three layers:

1. Behavior Primitives / 行为原语
2. Product Archetypes / 产物型主母型
3. Scenario Patterns / 场景组合范式

See: [Archetype Taxonomy](./archetype-taxonomy.md)

The Scenario Pattern layer is represented by the independent [`@yutra/scenario-pattern-core`](./scenario-pattern-core.md) contract. Scenario Pattern manifests reference these existing Product and Cross-cutting Archetypes without becoming additional archetype IDs.

The main archetypes below are product-facing archetypes. They are differentiated by primary output, acceptance object, and governance focus, not by being mutually exclusive low-level primitives.

中文说明：下面的 10 个主母型是面向创建体验和验收对象的产物型主母型，不是底层不可再分的行为原语。行为原语、产物型主母型与场景组合范式之间的关系见 [Archetype Taxonomy](./archetype-taxonomy.md)。

`@yutra/archetype-core` now exposes this classification as manifest taxonomy metadata. The 10 main archetypes remain `product_archetype`; the 4 cross-cutting archetypes remain `cross_cutting_archetype`.

## Main Archetypes

### 1. `intake-collector` / 信息采集型

- Definition: Collect required information from a user or system before work can proceed.
- Core flow: start intake -> validate required fields -> ask for missing fields -> confirm completeness -> hand off to next archetype.
- Use cases: onboarding forms, support intake, loan pre-check, service request collection.
- Common rules: required fields, retry count, missing-field strategy, validation failure strategy, confidence threshold.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`.

### 2. `knowledge-answering` / 知识问答型

- Definition: Answer questions using controlled knowledge sources and response templates.
- Core flow: classify question -> retrieve knowledge -> select answer template -> cite/source answer -> escalate if confidence or policy fails.
- Use cases: FAQ assistant, policy explanation, internal knowledge lookup, customer self-service.
- Common rules: allowed sources, confidence threshold, no-answer behavior, citation requirement, stale content policy.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `feedback-optimization`.
- Current support: `@yutra/pack-config-core` and `@yutra/rule-compiler` include a public demo/mock knowledge-answering core chain. CLI compile/export is supported. Creator Workbench UI is not enabled for this archetype yet.

### 3. `request-resolution` / 请求处理型

- Definition: Resolve a user request through SOP, rules, adapters, and final response.
- Core flow: triage request -> fetch business object -> evaluate eligibility -> execute allowed action -> respond or hand off.
- Use cases: refund, return, shipping inquiry, account update, service cancellation.
- Common rules: eligibility thresholds, amount limits, status-based routing, exception handling, retry/handoff strategy.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`, `feedback-optimization`.

### 4. `approval-decision` / 审批裁决型

- Definition: Decide whether a requested action can proceed based on policy, risk, and human approval.
- Core flow: intake request -> validate risk -> check policy -> request approval if needed -> approve/deny/escalate -> execute or close.
- Use cases: access approval, discount approval, configuration change approval, refund exception approval.
- Common rules: risk level, approval threshold, approver requirement, expiry, escalation rule, denial template.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`.
- Current support: `@yutra/pack-config-core` and `@yutra/rule-compiler` include a public demo/mock approval-decision chain. Creator Workbench UI is demo-enabled for this archetype.

### 5. `diagnostic-resolution` / 诊断排障型

- Definition: Diagnose a problem through observations, checks, and resolution steps.
- Core flow: collect symptoms -> run checks -> classify cause -> apply fix or recommendation -> verify result -> escalate if unresolved.
- Use cases: IT helpdesk, device troubleshooting, operations incident triage, account access issues.
- Common rules: diagnostic tree, check order, max attempts, critical issue handoff, repair action permission.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`.

### 6. `process-orchestration` / 流程编排型

- Definition: Coordinate multiple steps, systems, or roles in a controlled business process.
- Core flow: create process context -> execute step sequence -> wait for external input if needed -> validate each step -> complete or hand off.
- Use cases: employee onboarding, procurement workflow, claim processing, multi-system service fulfillment.
- Common rules: step dependency, retry policy, SLA boundary, required evidence, blocked-step handoff.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`, `feedback-optimization`.

### 7. `content-production` / 内容生成型

- Definition: Produce content from structured requirements, policy constraints, and review rules.
- Core flow: collect brief -> validate constraints -> draft content -> inspect/review -> revise or approve -> export.
- Use cases: marketing copy draft, support reply draft, proposal outline, policy-compliant message generation.
- Common rules: tone, forbidden claims, required sections, review threshold, human approval requirement.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `feedback-optimization`.

### 8. `data-insight` / 数据洞察型

- Definition: Produce structured insight from data sources with traceable assumptions and outputs.
- Core flow: define question -> fetch data -> validate data quality -> compute/inspect -> summarize insight -> flag uncertainty.
- Use cases: sales summary, support trend analysis, operations report, anomaly explanation.
- Common rules: allowed data sources, freshness requirement, aggregation level, privacy boundary, uncertainty threshold.
- Composable cross-cutting archetypes: `policy-guard`, `adapter-connector`, `feedback-optimization`.

### 9. `lead-engagement` / 线索跟进型

- Definition: Engage and qualify leads according to rules, stage, and allowed outreach actions.
- Core flow: identify lead context -> qualify -> choose next action -> send approved response or task -> update status -> hand off if high value.
- Use cases: inbound lead qualification, trial follow-up, event lead routing, partner inquiry triage.
- Common rules: qualification criteria, outreach frequency, channel rules, opt-out rule, high-value handoff.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`.

### 10. `monitoring-response` / 监控预警型

- Definition: Respond to system or business signals with controlled triage and escalation.
- Core flow: receive signal -> classify severity -> enrich context -> run response action -> notify or hand off -> record outcome.
- Use cases: incident alert response, fraud signal triage, SLA breach alert, inventory exception handling.
- Common rules: severity threshold, notification routing, allowed automated response, escalation timing, duplicate suppression.
- Composable cross-cutting archetypes: `human-handoff`, `policy-guard`, `adapter-connector`, `feedback-optimization`.

## Cross-cutting Archetypes

### 1. `human-handoff` / 人工协同型

- Definition: Convert a blocked, risky, or policy-sensitive path into a structured human review request.
- Core flow: detect handoff condition -> build review request -> summarize evidence -> route to human -> stop or wait.
- Use cases: high-risk refund, missing information, policy exception, uncertain answer, escalated approval.
- Common rules: reason code, severity, required fields, recommended actions, target queue.
- Composes with: all main archetypes.

### 2. `policy-guard` / 策略守卫型

- Definition: Apply allow/deny/require-handoff rules before an action proceeds.
- Core flow: evaluate policy -> allow action, deny action, or require handoff -> attach policy evidence.
- Use cases: action permission, side-effect control, risk gating, regulated workflow.
- Common rules: environment profile, side effect level, max amount, risk level, approval requirement.
- Composes with: all main archetypes.

### 3. `adapter-connector` / 系统接入型

- Definition: Connect a business archetype to customer systems through stable adapter contracts.
- Core flow: map input -> call adapter -> normalize response -> classify errors -> return contract-shaped result.
- Use cases: order lookup, CRM lookup, ticket creation, logistics query, payment status query.
- Common rules: required fields, timeout, retry, rate limit, error mapping, idempotency key.
- Composes with: most main archetypes that need external systems.

### 4. `feedback-optimization` / 复盘优化型

- Definition: Convert trace, audit, and human feedback into future configuration improvement.
- Core flow: collect run outcome -> compare expectation -> identify drift -> propose rule/template/test update -> review before adoption.
- Use cases: template refinement, policy threshold adjustment, missed handoff review, certification update.
- Common rules: feedback source, review requirement, change approval, regression test requirement.
- Composes with: knowledge-answering, request-resolution, process-orchestration, content-production, data-insight.

## Why Start With `request-resolution`

The first vNext creator should focus on `request-resolution` using public request-handling scenarios such as normal resolution, boundary handling, exception handling, and human handoff.

Reasons:

- It maps to existing public examples without requiring customer-specific SOP or implementation playbooks.
- It exercises rules, adapters, templates, policy, handoff, trace, audit, and certification.
- It proves that customers can configure business behavior without editing DSL first.
- It is broad enough to validate the creation model without implementing all archetypes at once.

The first five priority archetypes are:

- `request-resolution`
- `approval-decision`
- `knowledge-answering`
- `intake-collector`
- `human-handoff`

## Second Archetype Core Chain

`approval-decision` is the second public core chain after `request-resolution`.

It currently proves the shared vNext pattern at the standard layer:

- Pack Config contract
- Rule Impact metadata
- deterministic Rule Compiler
- CLI compile/export path
- six demo/mock artifacts

It does not include Runtime execution, real approval systems, real organization data, customer SOP, approval hierarchy, pricing, UAT, rollout, or delivery playbooks.

## Third Archetype Core Chain

`knowledge-answering` is the third public core chain after `request-resolution` and `approval-decision`.

It currently proves the shared vNext pattern for governed knowledge answering:

- Pack Config contract
- Rule Impact metadata
- deterministic Rule Compiler
- CLI compile/export path
- six demo/mock artifacts

It does not include Creator Workbench UI integration yet, Runtime execution, real LLM calls, real knowledge base content, retrieval provider configuration, real source endpoints, customer SOP, or delivery templates.
