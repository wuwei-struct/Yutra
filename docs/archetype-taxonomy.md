# Archetype Taxonomy

# 母型分类学：行为原语、产物型主母型与场景组合范式

## 1. Why this taxonomy exists

Yutra defines 10 main archetypes and 4 cross-cutting archetypes. This taxonomy clarifies what those archetypes mean and prevents every business scenario from becoming a new archetype.

The 10 main archetypes are not primitive behavior atoms. They are product-facing archetypes organized by primary output, acceptance object, and governance focus.

10 个主母型不是底层不可再分的行为原语，而是面向创建体验、业务交付和验收对象的产物型主母型。

## 2. Layer 1: Behavior Primitives / 行为原语

Behavior Primitives are reusable engineering-level behavior capabilities. They are usually implemented through Action, Guard, Transition, Trace, or Policy structures, but they are not necessarily exposed directly to users as choices in Creator Workbench.

`@yutra/archetype-core` exports these primitives as `BEHAVIOR_PRIMITIVE_IDS` and `BUILTIN_BEHAVIOR_PRIMITIVES`. They are taxonomy metadata only; they do not change Runtime, Action, Guard, Trace, or DSL semantics.

| ID | 中文名 | Definition | Common Structure |
| --- | --- | --- | --- |
| `collect` | 收集 | Gather required information, evidence, or context before work can proceed. | Action, Guard, Transition, Trace |
| `retrieve` | 检索 | Fetch controlled knowledge, records, or business object state. | Action, Policy, Trace |
| `evaluate` | 判断 | Compare context against rules, thresholds, eligibility, or risk. | Guard, Policy, Transition, Trace |
| `execute` | 执行 | Perform an allowed business action or side-effect through a governed path. | Action, Policy, Trace |
| `generate` | 生成 | Produce a response, document, summary, template output, or structured artifact. | Action, Template, Trace |
| `route` | 路由 | Choose the next state, queue, handler, or escalation path. | Transition, Guard, Policy |
| `monitor` | 监控 | Observe a signal, threshold, event, or condition over time. | Action, Guard, Trace, Policy |
| `handoff` | 协同 | Transfer a blocked, risky, or review-required path to a human or external reviewer. | Action, Transition, Trace, Policy |
| `audit` | 记录审计 | Record evidence for replay, review, accountability, and certification. | Trace, Audit Bundle, Policy |
| `feedback` | 复盘优化 | Convert outcomes and review feedback into future rule, template, or test improvements. | Trace, Policy, Test Case |

## 3. Layer 2: Product Archetypes / 产物型主母型

Product Archetypes are the main user-facing creation units. They are differentiated by:

- primary output / 主要产出物
- acceptance object / 验收对象
- governance focus / 治理重点
- trigger pattern / 触发方式
- side-effect profile / 副作用画像

The main archetypes below are product-facing archetypes. They are differentiated by primary output, acceptance object, and governance focus, not by being mutually exclusive low-level primitives.

Each builtin `ArchetypeManifest` now includes `taxonomy` metadata with `layer`, `primitiveRefs`, `primaryOutput`, `acceptanceObject`, `governanceFocus`, and `triggerPattern`. Creator Workbench can use these fields to guide archetype choice without treating primitives as customer-facing products.

Creator Workbench uses this metadata in its taxonomy-aware archetype selector. The selector keeps the user-facing decision anchored on `primaryOutput` and `acceptanceObject`, while still showing Behavior Primitive refs as implementation metadata.

| Archetype | Primary Output | Acceptance Object | Governance Focus |
| --------- | -------------- | ----------------- | ---------------- |
| `intake-collector` | Complete intake package | Required information is collected and validated | Required fields, retry limit, missing-field strategy |
| `knowledge-answering` | Controlled answer | Answer is grounded, scoped, and safe to return | Source control, confidence, citation, no-answer behavior |
| `request-resolution` | Business action result | Request is completed, blocked, or handed off | Object state, time window, adapter failure, handoff |
| `approval-decision` | Authorization decision | Approved, rejected, more evidence requested, or human review required | Approval chain, reason, permission, side-effect |
| `diagnostic-resolution` | Diagnosis and resolution path | Issue is classified, fixed, recommended, or escalated | Check order, confidence, critical handoff, verification |
| `process-orchestration` | Controlled multi-step process outcome | Process reaches completion, wait state, or blocked state | Step dependency, SLA, evidence, retry, handoff |
| `content-production` | Governed content output | Content satisfies brief, constraints, and review rules | Claims, tone, required sections, review threshold |
| `data-insight` | Structured insight | Insight is traceable to data and assumptions | Data source, freshness, aggregation, privacy, uncertainty |
| `lead-engagement` | Lead qualification or next action | Lead is qualified, routed, messaged, or handed off | Outreach rules, stage, opt-out, high-value escalation |
| `monitoring-response` | Event response result | Signal is classified and responded to or escalated | Source, threshold, deduplication, throttling, escalation |

## 4. Layer 3: Scenario Pattern / 场景组合范式

Real business scenarios are often not a single main archetype. They are usually a Product Archetype plus cross-cutting archetypes and helper archetypes.

Scenario Patterns are useful presets for product and delivery thinking, but they should not automatically become new main archetype IDs.

### Ecommerce refund / 电商退款

Main archetype:

- `request-resolution`

Cross-cutting archetypes:

- `policy-guard`
- `adapter-connector`
- `human-handoff`

The primary output is the refund handling result. The scenario may retrieve order state, evaluate eligibility, execute a mock refund path, or request handoff.

### Customer complaint / 客户投诉

Customer complaint is not a single main archetype. It is a scenario pattern.

Possible composition:

- `knowledge-answering`
- `request-resolution`
- `approval-decision`
- `human-handoff`
- `policy-guard`
- `monitoring-response`

Selection depends on the sub-scenario:

- Explaining a policy: `knowledge-answering`
- Requesting compensation: `request-resolution` + `approval-decision`
- Triggered by negative review or public signal: `monitoring-response`

### Renewal churn warning / 续费流失预警

Possible composition:

- `monitoring-response`
- `data-insight`
- `lead-engagement`
- `human-handoff`

The primary trigger source is a system signal, so the main archetype can start as `monitoring-response`.

## 5. Archetype Fit Test / 母型适配测试

Every new scenario must answer:

1. What is the primary output?
2. What is the trigger source?
3. Does it create real business side effects?
4. Does it require approval or human decision?
5. What is the main business object?
6. What is the normal path?
7. What is the exception path?
8. What is the minimal archetype composition?
9. Which archetype is the main archetype?
10. Which archetypes are cross-cutting archetypes?

Rule: if the main archetype cannot be selected within 10 minutes, the scenario is probably a Scenario Pattern rather than a new Product Archetype.

## 6. Boundary rules / 边界规则

- Do not promote every industry scenario into a main archetype.
- Do not treat real business solutions such as customer complaints, reimbursement, or admissions consulting as low-level archetypes.
- Product Archetypes are differentiated by output and acceptance object, not by industry name.
- Behavior Primitives are for engineering implementation, Product Archetypes are for creation experience, and Scenario Patterns are for business composition.
- Cross-cutting archetypes support governance, collaboration, integration, and feedback. They do not usually represent a complete business output by themselves.
- Keep customer SOP, real adapter mapping, pricing, UAT, rollout, and delivery playbooks outside the public archetype taxonomy.
