import type {
  SlotOutcomeProjectionCondition,
  SlotOutcomeProjectionContract,
  SlotOutcomeProjectionEvaluation,
  SlotOutcomeProjectionEvidence,
  SlotProjectionScalar
} from "./types";
import type { ScenarioOrchestratorIssue } from "./errors";
import { slotOutcomeProjectionContractSchema } from "./orchestrator-schema";

const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);
const PATH_SEGMENT_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isSafeProjectionOutputPath(path: string): boolean {
  const segments = path.split(".");
  return (
    segments.length > 0 &&
    segments.every(
      (segment) => PATH_SEGMENT_PATTERN.test(segment) && !UNSAFE_PATH_SEGMENTS.has(segment)
    )
  );
}

export function validateSlotOutcomeProjectionContract(input: {
  contract: unknown;
  slotId: string;
  acceptedOutcomes: readonly string[];
}): ScenarioOrchestratorIssue[] {
  const parsed = slotOutcomeProjectionContractSchema.safeParse(input.contract);
  if (!parsed.success) {
    return [
      {
        code:
          input.contract === undefined
            ? "ORCHESTRATOR_OUTCOME_PROJECTION_MISSING"
            : "ORCHESTRATOR_OUTCOME_PROJECTION_INVALID",
        message: `Slot ${input.slotId} requires a strict Outcome Projection Contract.`,
        path: ["slots", input.slotId, "outcomeProjection"]
      }
    ];
  }

  const contract = parsed.data as SlotOutcomeProjectionContract;
  const issues: ScenarioOrchestratorIssue[] = [];
  const path = ["slots", input.slotId, "outcomeProjection"];
  if (contract.slotId !== input.slotId) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_INVALID",
      message: `Outcome Projection Contract must belong to Slot ${input.slotId}.`,
      path
    });
  }

  const priorities = contract.rules.map((rule) => rule.priority);
  if (new Set(priorities).size !== priorities.length) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_PRIORITY_CONFLICT",
      message: `Slot ${input.slotId} Outcome Projection priorities must be unique.`,
      path
    });
  }

  const unsafePath = contract.rules
    .flatMap((rule) => rule.all)
    .find(
      (condition) =>
        condition.source === "output_path" &&
        (!isSafeProjectionOutputPath(condition.path) ||
          (condition.operator === "equals" &&
            !Object.prototype.hasOwnProperty.call(condition, "value")))
    );
  if (unsafePath) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_PATH_UNSAFE",
      message: `Slot ${input.slotId} contains an unsafe or incomplete output marker path.`,
      path
    });
  }

  const projectedOutcomes = new Set(contract.rules.map((rule) => rule.outcome));
  const missing = input.acceptedOutcomes.filter((outcome) => !projectedOutcomes.has(outcome));
  const extra = [...projectedOutcomes].filter(
    (outcome) => !input.acceptedOutcomes.includes(outcome)
  );
  if (missing.length > 0) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_INCOMPLETE",
      message: `Slot ${input.slotId} has accepted outcomes without projection rules: ${missing.join(", ")}.`,
      path
    });
  }
  if (extra.length > 0) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_EXTRA",
      message: `Slot ${input.slotId} projects undeclared outcomes: ${extra.join(", ")}.`,
      path
    });
  }

  const doneOnlyOutcomes = new Set(
    contract.rules
      .filter(
        (rule) =>
          rule.all.length > 0 &&
          rule.all.every(
            (condition) =>
              condition.source === "runtime_final_state" &&
              condition.operator === "equals" &&
              condition.value === "done"
          )
      )
      .map((rule) => rule.outcome)
  );
  if (doneOnlyOutcomes.size > 1) {
    issues.push({
      code: "ORCHESTRATOR_OUTCOME_PROJECTION_AMBIGUOUS",
      message: `Slot ${input.slotId} cannot derive multiple semantic outcomes from finalState=done alone.`,
      path
    });
  }

  return issues;
}

function conditionMatches(
  condition: SlotOutcomeProjectionCondition,
  evidence: SlotOutcomeProjectionEvidence
): boolean {
  if (condition.source === "runtime_status") {
    return evidence.runtimeStatus === condition.value;
  }
  if (condition.source === "runtime_final_state") {
    return evidence.runtimeFinalState === condition.value;
  }
  if (condition.source === "control_signal") {
    return evidence.controlSignal === condition.value;
  }
  if (condition.source === "error_code") {
    return evidence.errorCode === condition.value;
  }

  const hasMarker = Object.prototype.hasOwnProperty.call(evidence.outputMarkers, condition.path);
  const marker = evidence.outputMarkers[condition.path] as SlotProjectionScalar | undefined;
  if (condition.operator === "exists") return hasMarker;
  if (condition.operator === "is_true") return marker === true;
  return hasMarker && marker === condition.value;
}

export function evaluateSlotOutcomeProjection(input: {
  contract: SlotOutcomeProjectionContract;
  evidence: SlotOutcomeProjectionEvidence;
}): SlotOutcomeProjectionEvaluation {
  const contract = structuredClone(input.contract);
  const evidence = structuredClone(input.evidence);
  const semanticMarker = evidence.outputMarkers["slotResult.semanticMarker"];
  const declaredOutcomes = new Set(contract.rules.map((rule) => rule.outcome));

  if (typeof semanticMarker === "string" && !declaredOutcomes.has(semanticMarker)) {
    return {
      matched: false,
      fallbackApplied: true,
      failureCode: "ORCHESTRATOR_OUTCOME_PROJECTION_MARKER_UNKNOWN"
    };
  }

  const matches = contract.rules
    .filter((rule) => rule.all.every((condition) => conditionMatches(condition, evidence)))
    .sort(
      (left, right) =>
        right.priority - left.priority || left.projectionId.localeCompare(right.projectionId)
    );

  if (matches.length === 0) {
    return {
      matched: false,
      fallbackApplied: true,
      failureCode: "ORCHESTRATOR_OUTCOME_PROJECTION_NO_MATCH"
    };
  }

  const highestPriority = matches[0]?.priority;
  const highestMatches = matches.filter((rule) => rule.priority === highestPriority);
  if (highestMatches.length !== 1) {
    return {
      matched: false,
      fallbackApplied: true,
      failureCode: "ORCHESTRATOR_OUTCOME_PROJECTION_AMBIGUOUS"
    };
  }

  const match = highestMatches[0];
  return {
    matched: true,
    outcome: match.outcome,
    projectionId: match.projectionId,
    fallbackApplied: false
  };
}
