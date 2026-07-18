import type {
  ScenarioCompositionCompileResult
} from "@yutra/scenario-composition-compiler";
import type {
  ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import {
  COMPOSITION_PRECEDENCE_RULES
} from "@yutra/scenario-composition-core";
import {
  DEFAULT_SCENARIO_CONTEXT_POLICY,
  DEFAULT_SCENARIO_EXECUTION_POLICY,
  DEFAULT_SCENARIO_FAILURE_POLICY,
  DEFAULT_SCENARIO_HANDOFF_POLICY,
  DEFAULT_SCENARIO_TRACE_POLICY,
  expectedSlotNamespaces,
  type ScenarioOrchestratorDocument,
  type ScenarioOrchestratorPreviewBundleReference
} from "@yutra/scenario-orchestrator-core";
import type { ScenarioOrchestratorCompileProfile } from "./types";

export function toOrchestratorBundleReference(
  result: ScenarioCompositionCompileResult
): ScenarioOrchestratorPreviewBundleReference {
  return {
    compositionId: result.compositionId,
    compositionVersion: result.compositionVersion,
    patternId: result.patternId,
    executionModel: result.executionModel,
    previewOnly: true,
    runtimeExecutable: false,
    planHash: result.planHash,
    bundleHash: result.bundleHash,
    slots: result.slots.map((slot) => ({
      slotId: slot.slotId,
      role: slot.role,
      archetypeId: slot.archetypeId,
      packConfigId: slot.packConfigId,
      namespace: slot.namespace,
      configHash: slot.configHash,
      artifactHashes: slot.artifactHashes
    }))
  };
}

export function bindScenarioOrchestratorDocument(input: {
  plan: ScenarioCompositionPlan;
  result: ScenarioCompositionCompileResult;
  profile: ScenarioOrchestratorCompileProfile;
  orchestratorHash: string;
}): ScenarioOrchestratorDocument {
  const { plan, result, profile, orchestratorHash } = input;
  const routeProfiles = new Map(
    profile.routeProfiles.map((route) => [
      route.compositionRouteId,
      route
    ])
  );
  const slotProfiles = new Map(
    profile.slotProfiles.map((slot) => [slot.slotId, slot])
  );

  const routes = plan.routes.map((route) => {
    const routeProfile = routeProfiles.get(route.routeId);
    if (!routeProfile) {
      throw new Error(`ORCHESTRATOR_PROFILE_ROUTE_MISSING:${route.routeId}`);
    }
    return {
      routeId: route.routeId,
      fromSlotId: route.fromSlotId,
      outcome: routeProfile.outcome,
      conditionRef: route.conditionRef,
      priority: routeProfile.priority,
      effect: structuredClone(routeProfile.effect),
      provenanceRef: { compositionRouteId: route.routeId }
    };
  });

  return {
    schemaVersion: "1.0.0-preview",
    kind: "scenario_orchestrator",
    orchestratorId: profile.profileId.replace(/-profile$/, "-contract"),
    version: `${profile.version}-preview`,
    compositionRef: {
      compositionId: plan.compositionId,
      compositionVersion: plan.version,
      patternId: plan.patternRef.patternId,
      planHash: result.planHash,
      bundleHash: result.bundleHash
    },
    executionModel: "single_active_slot_call_return",
    previewOnly: true,
    runtimeExecutable: false,
    entrySlotId: plan.primarySlotId,
    slots: plan.slots.map((slot) => {
      const compiledSlot = result.slots.find(
        (candidate) => candidate.slotId === slot.slotId
      );
      const slotProfile = slotProfiles.get(slot.slotId);
      if (!compiledSlot || !slotProfile) {
        throw new Error(`ORCHESTRATOR_PROFILE_SLOT_MISMATCH:${slot.slotId}`);
      }
      return {
        slotId: slot.slotId,
        role: slot.role,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        artifactRef: {
          namespace: compiledSlot.namespace,
          agentArtifactPath: `${compiledSlot.namespace}/agent.yutra.yaml`,
          agentArtifactHash:
            compiledSlot.artifactHashes["agent.yutra.yaml"],
          configHash: compiledSlot.configHash
        },
        ...expectedSlotNamespaces(slot.slotId),
        acceptedOutcomes: [...slotProfile.acceptedOutcomes],
        callableBySlotIds: [...slotProfile.callableBySlotIds],
        outcomeProjection: structuredClone(slotProfile.outcomeProjection)
      };
    }),
    routes,
    bindings: plan.dataBindings.map((binding) => ({
      ...structuredClone(binding),
      provenanceRef: { compositionBindingId: binding.bindingId }
    })),
    terminals: structuredClone(profile.terminalProfiles),
    contextPolicy: structuredClone(DEFAULT_SCENARIO_CONTEXT_POLICY),
    executionPolicy: structuredClone(DEFAULT_SCENARIO_EXECUTION_POLICY),
    failurePolicy: structuredClone(DEFAULT_SCENARIO_FAILURE_POLICY),
    handoffPolicy: structuredClone(DEFAULT_SCENARIO_HANDOFF_POLICY),
    tracePolicy: structuredClone(DEFAULT_SCENARIO_TRACE_POLICY),
    precedencePolicyRef: {
      conflictMode: "fail_closed",
      rules: [...COMPOSITION_PRECEDENCE_RULES]
    },
    overlayRefs: plan.crossCuttingOverlays.map((overlay) => ({
      ...structuredClone(overlay),
      provenanceRef: { compositionOverlayId: overlay.overlayId }
    })),
    provenance: {
      compositionId: plan.compositionId,
      compositionVersion: plan.version,
      patternId: plan.patternRef.patternId,
      planHash: result.planHash,
      bundleHash: result.bundleHash,
      orchestratorHash,
      slotSources: result.slots.map((slot) => ({
        slotId: slot.slotId,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        configHash: slot.configHash,
        agentArtifactHash: slot.artifactHashes["agent.yutra.yaml"],
        outcomeProjectionIds: [
          ...(slotProfiles.get(slot.slotId)?.outcomeProjection.rules.map(
            (rule) => rule.projectionId
          ) ?? [])
        ]
      })),
      routeSources: plan.routes.map((route) => ({
        routeId: route.routeId,
        compositionRouteId: route.routeId
      })),
      bindingSources: plan.dataBindings.map((binding) => ({
        bindingId: binding.bindingId,
        compositionBindingId: binding.bindingId
      })),
      overlaySources: plan.crossCuttingOverlays.map((overlay) => ({
        overlayId: overlay.overlayId,
        compositionOverlayId: overlay.overlayId
      }))
    },
    publicExposure: structuredClone(profile.publicExposure)
  };
}
