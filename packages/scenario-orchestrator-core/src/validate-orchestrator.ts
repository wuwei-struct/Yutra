import {
  COMPOSITION_PRECEDENCE_RULES,
  validateScenarioComposition
} from "@yutra/scenario-composition-core";
import { DEFAULT_SCENARIO_CONTEXT_POLICY, expectedSlotNamespaces } from "./context-policy";
import type {
  ScenarioOrchestratorIssue,
  ScenarioOrchestratorIssueCode,
  ScenarioOrchestratorValidationResult
} from "./errors";
import { DEFAULT_SCENARIO_TERMINALS, SCENARIO_TERMINAL_IDS } from "./execution-semantics";
import { scenarioOrchestratorDocumentSchema } from "./orchestrator-schema";
import { SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES } from "./trace-contract";
import type {
  ScenarioOrchestratorDocument,
  ScenarioOrchestratorRoute,
  ScenarioOrchestratorValidationContext
} from "./types";

const FORBIDDEN_KEYS = new Set([
  "mergedPackConfig",
  "flattenedConfig",
  "flattenedSlotState",
  "deepMerge",
  "script",
  "expression",
  "endpoint",
  "credential",
  "secret"
]);

function issue(
  code: ScenarioOrchestratorIssueCode,
  message: string,
  path?: string[]
): ScenarioOrchestratorIssue {
  return { code, message, path };
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function hasForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  return Object.entries(value).some(([key, nested]) => FORBIDDEN_KEYS.has(key) || hasForbiddenKey(nested));
}

function exactOrderedSet(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function exactUnorderedSet(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value) => expected.includes(value))
  );
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function schemaIssueCode(path: string[]): ScenarioOrchestratorIssueCode {
  const joined = path.join(".");
  if (joined === "kind") return "ORCHESTRATOR_KIND_INVALID";
  if (joined === "executionModel") return "ORCHESTRATOR_EXECUTION_MODEL_UNSUPPORTED";
  if (joined === "previewOnly") return "ORCHESTRATOR_PREVIEW_FLAG_INVALID";
  if (joined === "runtimeExecutable") return "ORCHESTRATOR_RUNTIME_EXECUTABLE_FORBIDDEN";
  if (path[0] === "compositionRef") return "ORCHESTRATOR_COMPOSITION_REF_INVALID";
  if (path[0] === "entrySlotId") return "ORCHESTRATOR_ENTRY_SLOT_INVALID";
  if (path[0] === "slots" && path.includes("agentArtifactPath")) {
    return "ORCHESTRATOR_SLOT_ARTIFACT_PATH_INVALID";
  }
  if (path[0] === "slots" && (path.includes("agentArtifactHash") || path.includes("configHash"))) {
    return "ORCHESTRATOR_SLOT_ARTIFACT_HASH_MISSING";
  }
  if (path[0] === "routes") return "ORCHESTRATOR_ROUTE_TARGET_INVALID";
  if (path[0] === "bindings") return "ORCHESTRATOR_BINDING_INVALID";
  if (path[0] === "contextPolicy") {
    if (joined.endsWith("implicitMergeAllowed")) return "ORCHESTRATOR_IMPLICIT_MERGE_FORBIDDEN";
    if (joined.endsWith("adapterInheritanceAllowed")) return "ORCHESTRATOR_ADAPTER_INHERITANCE_FORBIDDEN";
    if (joined.endsWith("secretPropagationAllowed")) return "ORCHESTRATOR_SECRET_PROPAGATION_FORBIDDEN";
    return "ORCHESTRATOR_CONTEXT_POLICY_INVALID";
  }
  if (path[0] === "executionPolicy") {
    if (joined.endsWith("maxCallDepth")) return "ORCHESTRATOR_CALL_DEPTH_UNSUPPORTED";
    return "ORCHESTRATOR_BUDGET_INVALID";
  }
  if (path[0] === "terminals") return "ORCHESTRATOR_TERMINAL_INVALID";
  if (path[0] === "precedencePolicyRef") return "ORCHESTRATOR_PRECEDENCE_INCOMPLETE";
  if (path[0] === "tracePolicy") return "ORCHESTRATOR_TRACE_POLICY_INCOMPLETE";
  if (path[0] === "provenance") return "ORCHESTRATOR_PROVENANCE_INVALID";
  if (path[0] === "publicExposure") return "ORCHESTRATOR_PUBLIC_BOUNDARY_INVALID";
  return "ORCHESTRATOR_SCHEMA_INVALID";
}

function hasInvokeCycle(routes: ScenarioOrchestratorRoute[]): boolean {
  const edges = new Map<string, string[]>();
  for (const route of routes) {
    if (route.effect.type !== "invoke_slot") continue;
    const targets = edges.get(route.fromSlotId) ?? [];
    targets.push(route.effect.targetSlotId);
    edges.set(route.fromSlotId, targets);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (slotId: string): boolean => {
    if (visiting.has(slotId)) return true;
    if (visited.has(slotId)) return false;
    visiting.add(slotId);
    for (const target of edges.get(slotId) ?? []) {
      if (visit(target)) return true;
    }
    visiting.delete(slotId);
    visited.add(slotId);
    return false;
  };

  return [...edges.keys()].some(visit);
}

export function validateScenarioOrchestrator(
  input: unknown,
  context: ScenarioOrchestratorValidationContext
): ScenarioOrchestratorValidationResult {
  const issues: ScenarioOrchestratorIssue[] = [];

  if (hasForbiddenKey(input)) {
    issues.push(
      issue(
        "ORCHESTRATOR_IMPLICIT_MERGE_FORBIDDEN",
        "Flattened config, deep merge, scripts, credentials, and implicit endpoint fields are forbidden."
      )
    );
  }

  const parsed = scenarioOrchestratorDocumentSchema.safeParse(input);
  if (!parsed.success) {
    for (const schemaIssue of parsed.error.issues) {
      const path = schemaIssue.path.map(String);
      issues.push(issue(schemaIssueCode(path), schemaIssue.message, path));
    }
    return { ok: false, issues };
  }

  const document = parsed.data as ScenarioOrchestratorDocument;
  const plan = context.compositionPlan;
  const bundle = context.compositionBundle;
  const planValidation = validateScenarioComposition(plan);

  if (!planValidation.ok) {
    issues.push(
      issue(
        "ORCHESTRATOR_COMPOSITION_REF_INVALID",
        `Composition Plan is invalid: ${planValidation.issues.map((item) => item.code).join(", ")}.`,
        ["compositionRef"]
      )
    );
  }

  if (
    document.compositionRef.compositionId !== plan.compositionId ||
    document.compositionRef.compositionVersion !== plan.version ||
    document.compositionRef.patternId !== plan.patternRef.patternId ||
    document.compositionRef.compositionId !== bundle.compositionId ||
    document.compositionRef.compositionVersion !== bundle.compositionVersion ||
    document.compositionRef.patternId !== bundle.patternId ||
    document.compositionRef.planHash !== bundle.planHash ||
    document.compositionRef.bundleHash !== bundle.bundleHash ||
    bundle.executionModel !== "orchestrated_subflows" ||
    bundle.previewOnly !== true ||
    bundle.runtimeExecutable !== false
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_COMPOSITION_REF_INVALID",
        "Orchestrator compositionRef must match the validated Composition Plan and Preview Bundle.",
        ["compositionRef"]
      )
    );
  }

  for (const duplicate of duplicateValues(document.slots.map((slot) => slot.slotId))) {
    issues.push(issue("ORCHESTRATOR_SLOT_DUPLICATE", `Duplicate Slot ${duplicate}.`, ["slots"]));
  }
  for (const duplicate of duplicateValues(document.slots.map((slot) => slot.artifactRef.namespace))) {
    issues.push(
      issue(
        "ORCHESTRATOR_SLOT_NAMESPACE_COLLISION",
        `Duplicate Slot artifact namespace ${duplicate}.`,
        ["slots"]
      )
    );
  }

  const primarySlots = document.slots.filter((slot) => slot.role === "primary");
  if (primarySlots.length === 0) {
    issues.push(
      issue("ORCHESTRATOR_PRIMARY_SLOT_MISSING", "Exactly one Primary Slot is required.", ["slots"])
    );
  } else if (primarySlots.length > 1) {
    issues.push(
      issue("ORCHESTRATOR_MULTIPLE_PRIMARY_SLOTS", "Multiple Primary Slots are forbidden.", ["slots"])
    );
  }
  const entrySlot = document.slots.find((slot) => slot.slotId === document.entrySlotId);
  if (!entrySlot || entrySlot.role !== "primary" || document.entrySlotId !== plan.primarySlotId) {
    issues.push(
      issue(
        "ORCHESTRATOR_ENTRY_SLOT_INVALID",
        "entrySlotId must reference the unique Primary Slot from the Composition Plan.",
        ["entrySlotId"]
      )
    );
  }

  const slotIds = new Set(document.slots.map((slot) => slot.slotId));
  const bundleSlots = new Map(bundle.slots.map((slot) => [slot.slotId, slot]));
  const planSlots = new Map(plan.slots.map((slot) => [slot.slotId, slot]));
  for (const [index, slot] of document.slots.entries()) {
    const planSlot = planSlots.get(slot.slotId);
    const bundleSlot = bundleSlots.get(slot.slotId);
    if (
      !planSlot ||
      !bundleSlot ||
      slot.role !== planSlot.role ||
      slot.role !== bundleSlot.role ||
      slot.archetypeId !== planSlot.archetypeId ||
      slot.archetypeId !== bundleSlot.archetypeId ||
      slot.packConfigId !== planSlot.packConfigId ||
      slot.packConfigId !== bundleSlot.packConfigId
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_SLOT_REF_INVALID",
          `Slot ${slot.slotId} must match its Composition Plan and Preview Bundle entry.`,
          ["slots", String(index)]
        )
      );
      continue;
    }

    const expectedPath = `slots/${slot.slotId}/agent.yutra.yaml`;
    if (
      slot.artifactRef.namespace !== `slots/${slot.slotId}` ||
      slot.artifactRef.namespace !== bundleSlot.namespace ||
      slot.artifactRef.agentArtifactPath !== expectedPath
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_SLOT_ARTIFACT_PATH_INVALID",
          `Slot ${slot.slotId} must reference ${expectedPath}.`,
          ["slots", String(index), "artifactRef"]
        )
      );
    }
    const bundleAgentHash = bundleSlot.artifactHashes["agent.yutra.yaml"];
    if (
      !bundleAgentHash ||
      slot.artifactRef.agentArtifactHash !== bundleAgentHash ||
      slot.artifactRef.configHash !== bundleSlot.configHash
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_SLOT_ARTIFACT_HASH_MISSING",
          `Slot ${slot.slotId} artifact and config hashes must match the Preview Bundle.`,
          ["slots", String(index), "artifactRef"]
        )
      );
    }

    const expectedNamespaces = expectedSlotNamespaces(slot.slotId);
    if (
      slot.inputNamespace !== expectedNamespaces.inputNamespace ||
      slot.stateNamespace !== expectedNamespaces.stateNamespace ||
      slot.outputNamespace !== expectedNamespaces.outputNamespace
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_SLOT_NAMESPACE_COLLISION",
          `Slot ${slot.slotId} must use its isolated input, state, and output namespaces.`,
          ["slots", String(index)]
        )
      );
    }
    if (slot.callableBySlotIds.includes(slot.slotId)) {
      issues.push(
        issue(
          "ORCHESTRATOR_SELF_CALL_NOT_ALLOWED",
          `Slot ${slot.slotId} cannot call itself.`,
          ["slots", String(index), "callableBySlotIds"]
        )
      );
    }
    if (
      slot.role === "supporting" &&
      slot.callableBySlotIds.some((callerId) => callerId !== plan.primarySlotId)
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_SUPPORTING_CALL_NOT_ALLOWED",
          `Supporting Slot ${slot.slotId} can only be called by the Primary Slot.`,
          ["slots", String(index), "callableBySlotIds"]
        )
      );
    }
  }
  if (!exactUnorderedSet(document.slots.map((slot) => slot.slotId), plan.slots.map((slot) => slot.slotId))) {
    issues.push(
      issue(
        "ORCHESTRATOR_SLOT_REF_INVALID",
        "Orchestrator Slots must exactly match the Composition Plan Slots.",
        ["slots"]
      )
    );
  }

  for (const duplicate of duplicateValues(document.routes.map((route) => route.routeId))) {
    issues.push(issue("ORCHESTRATOR_ROUTE_DUPLICATE", `Duplicate Route ${duplicate}.`, ["routes"]));
  }
  const routePriorityKeys = document.routes.map(
    (route) => `${route.fromSlotId}\u0000${route.outcome}\u0000${route.priority}`
  );
  for (const duplicate of duplicateValues(routePriorityKeys)) {
    issues.push(
      issue(
        "ORCHESTRATOR_ROUTE_PRIORITY_CONFLICT",
        `Route priority conflict for ${duplicate.replaceAll("\u0000", "/")}.`,
        ["routes"]
      )
    );
  }

  const terminalIds = new Set<string>(document.terminals.map((terminal) => terminal.terminalId));
  const invokeTargets = new Set<string>();
  for (const [index, route] of document.routes.entries()) {
    const sourceSlot = document.slots.find((slot) => slot.slotId === route.fromSlotId);
    const compositionRoute = plan.routes.find(
      (candidate) => candidate.routeId === route.provenanceRef.compositionRouteId
    );
    if (!sourceSlot) {
      issues.push(
        issue(
          "ORCHESTRATOR_ROUTE_SOURCE_INVALID",
          `Route ${route.routeId} references an unknown source Slot.`,
          ["routes", String(index), "fromSlotId"]
        )
      );
      continue;
    }
    if (!sourceSlot.acceptedOutcomes.includes(route.outcome)) {
      issues.push(
        issue(
          "ORCHESTRATOR_ROUTE_AMBIGUOUS",
          `Route outcome ${route.outcome} is not declared by Slot ${sourceSlot.slotId}.`,
          ["routes", String(index), "outcome"]
        )
      );
    }
    if (!compositionRoute || compositionRoute.fromSlotId !== route.fromSlotId) {
      issues.push(
        issue(
          "ORCHESTRATOR_PROVENANCE_INVALID",
          `Route ${route.routeId} has no matching Composition Route provenance.`,
          ["routes", String(index), "provenanceRef"]
        )
      );
    }

    if (route.effect.type === "invoke_slot") {
      const targetSlotId = route.effect.targetSlotId;
      invokeTargets.add(targetSlotId);
      const target = document.slots.find((slot) => slot.slotId === targetSlotId);
      if (!target) {
        issues.push(
          issue(
            "ORCHESTRATOR_ROUTE_TARGET_INVALID",
            `Route ${route.routeId} targets an unknown Slot.`,
            ["routes", String(index), "effect", "targetSlotId"]
          )
        );
      } else if (targetSlotId === route.fromSlotId) {
        issues.push(
          issue(
            "ORCHESTRATOR_SELF_CALL_NOT_ALLOWED",
            `Route ${route.routeId} cannot invoke its source Slot.`,
            ["routes", String(index), "effect"]
          )
        );
      } else if (
        sourceSlot.role !== "primary" ||
        target.role !== "supporting" ||
        route.effect.returnToSlotId !== sourceSlot.slotId ||
        !target.callableBySlotIds.includes(sourceSlot.slotId)
      ) {
        issues.push(
          issue(
            "ORCHESTRATOR_SUPPORTING_CALL_NOT_ALLOWED",
            `Route ${route.routeId} violates Primary-to-Supporting call-return boundaries.`,
            ["routes", String(index), "effect"]
          )
        );
      }
    }

    if (route.effect.type === "resume_caller" && sourceSlot.role !== "supporting") {
      issues.push(
        issue(
          "ORCHESTRATOR_RESUME_WITHOUT_CALLER",
          `Only a Supporting Slot with a caller frame may resume_caller.`,
          ["routes", String(index), "effect"]
        )
      );
    }
    if (
      route.effect.type === "terminate" &&
      (route.effect.terminalId !== "$scenario_done" ||
        !terminalIds.has(route.effect.terminalId) ||
        sourceSlot.role !== "primary")
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_TERMINAL_INVALID",
          `Route ${route.routeId} has an invalid terminal transition.`,
          ["routes", String(index), "effect"]
        )
      );
    }
    if (
      (route.effect.type === "request_handoff" || route.effect.type === "fail_closed") &&
      !terminalIds.has(route.effect.terminalId)
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_TERMINAL_INVALID",
          `Route ${route.routeId} references an undeclared terminal.`,
          ["routes", String(index), "effect"]
        )
      );
    }
  }
  for (const route of document.routes) {
    if (
      route.effect.type === "resume_caller" &&
      !invokeTargets.has(route.fromSlotId)
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_RESUME_WITHOUT_CALLER",
          `Supporting Slot ${route.fromSlotId} has no explicit inbound invocation Route.`,
          ["routes", route.routeId]
        )
      );
    }
  }
  if (hasInvokeCycle(document.routes)) {
    issues.push(
      issue(
        "ORCHESTRATOR_ROUTE_CYCLE_NOT_ALLOWED",
        "Static Slot invocation cycles are forbidden.",
        ["routes"]
      )
    );
  }

  for (const duplicate of duplicateValues(document.bindings.map((binding) => binding.bindingId))) {
    issues.push(
      issue("ORCHESTRATOR_BINDING_INVALID", `Duplicate Binding ${duplicate}.`, ["bindings"])
    );
  }
  for (const [index, binding] of document.bindings.entries()) {
    const compositionBinding = plan.dataBindings.find(
      (candidate) => candidate.bindingId === binding.provenanceRef.compositionBindingId
    );
    if (
      !slotIds.has(binding.fromSlotId) ||
      !slotIds.has(binding.toSlotId) ||
      !compositionBinding ||
      compositionBinding.fromSlotId !== binding.fromSlotId ||
      compositionBinding.fromPath !== binding.fromPath ||
      compositionBinding.toSlotId !== binding.toSlotId ||
      compositionBinding.toPath !== binding.toPath ||
      compositionBinding.required !== binding.required ||
      binding.transform !== "identity"
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_BINDING_INVALID",
          `Binding ${binding.bindingId} must match a declared identity Composition Binding.`,
          ["bindings", String(index)]
        )
      );
    }
  }
  for (const requiredBinding of plan.dataBindings.filter((binding) => binding.required)) {
    if (
      !document.bindings.some(
        (binding) => binding.provenanceRef.compositionBindingId === requiredBinding.bindingId
      )
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_BINDING_INVALID",
          `Required Composition Binding ${requiredBinding.bindingId} is missing.`,
          ["bindings"]
        )
      );
    }
  }

  if (!sameValue(document.contextPolicy, DEFAULT_SCENARIO_CONTEXT_POLICY)) {
    issues.push(
      issue(
        "ORCHESTRATOR_CONTEXT_POLICY_INVALID",
        "Context Policy must preserve fixed namespace isolation and explicit binding-only writes.",
        ["contextPolicy"]
      )
    );
  }

  if (
    !exactUnorderedSet(
      document.terminals.map((terminal) => terminal.terminalId),
      SCENARIO_TERMINAL_IDS
    ) ||
    !DEFAULT_SCENARIO_TERMINALS.every((expected) =>
      document.terminals.some((actual) => sameValue(actual, expected))
    )
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_TERMINAL_INVALID",
        "The complete fixed terminal set and statuses are required.",
        ["terminals"]
      )
    );
  }
  const completedTerminal = document.terminals.find(
    (terminal) => terminal.terminalId === "$scenario_done"
  );
  if (!completedTerminal?.primaryOutputRequired) {
    issues.push(
      issue(
        "ORCHESTRATOR_PRIMARY_OUTPUT_REQUIRED",
        "$scenario_done requires the Primary Slot to produce scenario.output.",
        ["terminals", "$scenario_done"]
      )
    );
  }

  if (
    document.precedencePolicyRef.conflictMode !== "fail_closed" ||
    !exactOrderedSet(document.precedencePolicyRef.rules, COMPOSITION_PRECEDENCE_RULES)
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_PRECEDENCE_INCOMPLETE",
        "Orchestrator precedence must preserve the complete ordered fail-closed Composition rules.",
        ["precedencePolicyRef"]
      )
    );
  }

  if (
    !exactUnorderedSet(
      document.tracePolicy.mandatoryEventTypes,
      SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES
    )
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_TRACE_POLICY_INCOMPLETE",
        "Trace Policy must declare every mandatory Orchestrator event contract.",
        ["tracePolicy", "mandatoryEventTypes"]
      )
    );
  }

  const provenance = document.provenance;
  if (
    provenance.compositionId !== document.compositionRef.compositionId ||
    provenance.compositionVersion !== document.compositionRef.compositionVersion ||
    provenance.patternId !== document.compositionRef.patternId ||
    provenance.planHash !== document.compositionRef.planHash ||
    provenance.bundleHash !== document.compositionRef.bundleHash ||
    !exactUnorderedSet(
      provenance.slotSources.map((source) => source.slotId),
      document.slots.map((slot) => slot.slotId)
    ) ||
    !exactUnorderedSet(
      provenance.routeSources.map((source) => source.routeId),
      document.routes.map((route) => route.routeId)
    ) ||
    !exactUnorderedSet(
      provenance.routeSources.map((source) => source.compositionRouteId),
      plan.routes.map((route) => route.routeId)
    ) ||
    !exactUnorderedSet(
      provenance.bindingSources.map((source) => source.bindingId),
      document.bindings.map((binding) => binding.bindingId)
    ) ||
    !exactUnorderedSet(
      provenance.bindingSources.map((source) => source.compositionBindingId),
      plan.dataBindings.map((binding) => binding.bindingId)
    ) ||
    !exactUnorderedSet(
      provenance.overlaySources.map((source) => source.overlayId),
      document.overlayRefs.map((overlay) => overlay.overlayId)
    ) ||
    !exactUnorderedSet(
      provenance.overlaySources.map((source) => source.compositionOverlayId),
      plan.crossCuttingOverlays.map((overlay) => overlay.overlayId)
    ) ||
    !document.slots.every((slot) =>
      provenance.slotSources.some(
        (source) =>
          source.slotId === slot.slotId &&
          source.archetypeId === slot.archetypeId &&
          source.packConfigId === slot.packConfigId &&
          source.configHash === slot.artifactRef.configHash &&
          source.agentArtifactHash === slot.artifactRef.agentArtifactHash
      )
    )
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_PROVENANCE_INVALID",
        "Orchestrator provenance must close over every Composition and Slot source.",
        ["provenance"]
      )
    );
  }

  for (const [index, overlay] of document.overlayRefs.entries()) {
    const compositionOverlay = plan.crossCuttingOverlays.find(
      (candidate) => candidate.overlayId === overlay.provenanceRef.compositionOverlayId
    );
    if (
      !compositionOverlay ||
      compositionOverlay.archetypeId !== overlay.archetypeId ||
      compositionOverlay.enforcementMode !== overlay.enforcementMode ||
      !sameValue(compositionOverlay.scopes, overlay.scopes)
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_PROVENANCE_INVALID",
          `Overlay ${overlay.overlayId} must match its Composition Overlay provenance.`,
          ["overlayRefs", String(index)]
        )
      );
    }
  }

  return { ok: issues.length === 0, issues };
}
