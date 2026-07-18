import type { ScenarioCompositionPlan } from "@yutra/scenario-composition-core";
import {
  DEFAULT_SCENARIO_TERMINALS,
  validateSlotOutcomeProjectionContract,
  type ScenarioRouteEffect
} from "@yutra/scenario-orchestrator-core";
import type { ScenarioOrchestratorCompileIssue } from "./errors";
import type { ScenarioOrchestratorCompileProfile } from "./types";

const PROFILE_KEYS = new Set([
  "profileId",
  "compositionId",
  "version",
  "slotProfiles",
  "routeProfiles",
  "terminalProfiles",
  "publicExposure"
]);

function sameSet(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value) => expected.includes(value))
  );
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function issue(
  code: ScenarioOrchestratorCompileIssue["code"],
  message: string,
  plan: ScenarioCompositionPlan,
  routeId?: string,
  slotId?: string
): ScenarioOrchestratorCompileIssue {
  return {
    code,
    severity: "error",
    message,
    compositionId: plan.compositionId,
    routeId,
    slotId
  };
}

function effectMatchesPlan(
  effect: ScenarioRouteEffect,
  plan: ScenarioCompositionPlan,
  routeId: string
): boolean {
  const route = plan.routes.find((candidate) => candidate.routeId === routeId);
  if (!route) return false;
  if (effect.type === "invoke_slot") {
    return (
      route.toSlotId === effect.targetSlotId &&
      route.fromSlotId === effect.returnToSlotId &&
      route.returnMode === "return_to_caller"
    );
  }
  if (effect.type === "resume_caller") {
    return (
      route.toSlotId === plan.primarySlotId &&
      route.returnMode === "return_to_caller"
    );
  }
  if (effect.type === "terminate") {
    return (
      route.toSlotId === effect.terminalId &&
      effect.terminalId === "$scenario_done" &&
      route.returnMode === "terminate_scenario"
    );
  }
  if (effect.type === "request_handoff") {
    return (
      route.toSlotId === "$human_handoff" &&
      route.returnMode === "terminate_scenario"
    );
  }
  return (
    route.toSlotId === "$fail_closed" &&
    route.returnMode === "terminate_scenario"
  );
}

export function validateScenarioOrchestratorCompileProfile(
  profile: ScenarioOrchestratorCompileProfile,
  plan: ScenarioCompositionPlan
): ScenarioOrchestratorCompileIssue[] {
  const issues: ScenarioOrchestratorCompileIssue[] = [];
  if (
    !profile ||
    typeof profile !== "object" ||
    Object.keys(profile).some((key) => !PROFILE_KEYS.has(key)) ||
    !profile.profileId ||
    !profile.version ||
    !Array.isArray(profile.slotProfiles) ||
    !Array.isArray(profile.routeProfiles)
  ) {
    return [
      issue(
        "ORCHESTRATOR_COMPILE_PROFILE_INVALID",
        "Compile Profile failed strict shape validation.",
        plan
      )
    ];
  }

  if (profile.compositionId !== plan.compositionId) {
    issues.push(
      issue(
        "ORCHESTRATOR_PROFILE_COMPOSITION_MISMATCH",
        `Compile Profile ${profile.profileId} does not target Composition ${plan.compositionId}.`,
        plan
      )
    );
  }

  const planSlotIds = plan.slots.map((slot) => slot.slotId);
  const profileSlotIds = profile.slotProfiles.map((slot) => slot.slotId);
  if (!sameSet(profileSlotIds, planSlotIds)) {
    issues.push(
      issue(
        "ORCHESTRATOR_PROFILE_SLOT_MISMATCH",
        "Compile Profile Slots must exactly match the Composition Plan Slots.",
        plan
      )
    );
  }

  for (const slotProfile of profile.slotProfiles) {
    const planSlot = plan.slots.find(
      (candidate) => candidate.slotId === slotProfile.slotId
    );
    if (
      !planSlot ||
      slotProfile.acceptedOutcomes.length === 0 ||
      new Set(slotProfile.acceptedOutcomes).size !==
        slotProfile.acceptedOutcomes.length ||
      new Set(slotProfile.callableBySlotIds).size !==
        slotProfile.callableBySlotIds.length ||
      slotProfile.callableBySlotIds.some(
        (caller) => !planSlotIds.includes(caller)
      ) ||
      (planSlot.role === "primary" &&
        slotProfile.callableBySlotIds.length > 0) ||
      (planSlot.role === "supporting" &&
        !sameSet(slotProfile.callableBySlotIds, [plan.primarySlotId]))
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_PROFILE_SLOT_MISMATCH",
          `Compile Profile Slot ${slotProfile.slotId} violates call-return boundaries.`,
          plan,
          undefined,
          slotProfile.slotId
        )
      );
    }
    issues.push(
      ...validateSlotOutcomeProjectionContract({
        contract: slotProfile.outcomeProjection,
        slotId: slotProfile.slotId,
        acceptedOutcomes: slotProfile.acceptedOutcomes
      }).map((projectionIssue) =>
        issue(
          projectionIssue.code as ScenarioOrchestratorCompileIssue["code"],
          projectionIssue.message,
          plan,
          undefined,
          slotProfile.slotId
        )
      )
    );
  }

  const planRouteIds = plan.routes.map((route) => route.routeId);
  const profileRouteIds = profile.routeProfiles.map(
    (route) => route.compositionRouteId
  );
  for (const routeId of planRouteIds.filter(
    (id) => !profileRouteIds.includes(id)
  )) {
    issues.push(
      issue(
        "ORCHESTRATOR_PROFILE_ROUTE_MISSING",
        `Compile Profile is missing Composition Route ${routeId}.`,
        plan,
        routeId
      )
    );
  }
  for (const routeId of profileRouteIds.filter(
    (id) => !planRouteIds.includes(id)
  )) {
    issues.push(
      issue(
        "ORCHESTRATOR_PROFILE_ROUTE_EXTRA",
        `Compile Profile contains undeclared Composition Route ${routeId}.`,
        plan,
        routeId
      )
    );
  }

  const priorities = profile.routeProfiles.map((route) => route.priority);
  if (
    priorities.some(
      (priority) => !Number.isSafeInteger(priority) || priority < 0
    ) ||
    new Set(priorities).size !== priorities.length
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_ROUTE_PRIORITY_CONFLICT",
        "Every Compile Profile Route requires a unique non-negative safe-integer priority.",
        plan
      )
    );
  }

  for (const routeProfile of profile.routeProfiles) {
    const planRoute = plan.routes.find(
      (candidate) =>
        candidate.routeId === routeProfile.compositionRouteId
    );
    const slotProfile = planRoute
      ? profile.slotProfiles.find(
          (candidate) => candidate.slotId === planRoute.fromSlotId
        )
      : undefined;
    if (
      !planRoute ||
      !slotProfile ||
      !slotProfile.acceptedOutcomes.includes(routeProfile.outcome) ||
      !effectMatchesPlan(
        routeProfile.effect,
        plan,
        routeProfile.compositionRouteId
      )
    ) {
      issues.push(
        issue(
          "ORCHESTRATOR_COMPILE_PROFILE_INVALID",
          `Compile Profile Route ${routeProfile.compositionRouteId} does not explicitly align with its Composition Route.`,
          plan,
          routeProfile.compositionRouteId
        )
      );
    }
  }

  if (
    !sameValue(profile.terminalProfiles, DEFAULT_SCENARIO_TERMINALS) ||
    profile.publicExposure.mode !== "demo_only" ||
    Object.entries(profile.publicExposure)
      .filter(([key]) => key !== "mode")
      .some(([, value]) => value !== false)
  ) {
    issues.push(
      issue(
        "ORCHESTRATOR_COMPILE_PROFILE_INVALID",
        "Compile Profile must preserve fixed Terminals and the demo-only public boundary.",
        plan
      )
    );
  }

  return issues;
}
