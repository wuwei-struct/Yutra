export type ScenarioEvidenceRunStatus =
  | "completed"
  | "handoff_required"
  | "failed";

export type ScenarioEvidenceTerminalId =
  | "$scenario_done"
  | "$human_handoff"
  | "$fail_closed";

export type ScenarioEvidenceTimelineItem = {
  index: number;
  source: "orchestrator_trace" | "projection_evidence";
  type: string;
  sequence?: number;
  invocationIndex?: number;
  slotId?: string;
  routeId?: string;
  bindingId?: string;
  overlayId?: string;
  decision?: string;
  semanticOutcome?: string;
  projectionId?: string;
  runtimeStatus?: string;
  terminalId?: string;
  errorCode?: string;
};

export type ScenarioRunEvidenceBundle = {
  schemaVersion: "1.0.0-preview";
  evidenceId: string;
  evidenceHash: string;
  run: {
    orchestratorRunId: string;
    orchestratorId: string;
    compositionId: string;
    demoCase: string;
    status: ScenarioEvidenceRunStatus;
    terminalId: ScenarioEvidenceTerminalId;
    scenarioCompleted: boolean;
  };
  sources: {
    planHash: string;
    compositionBundleHash: string;
    orchestratorHash: string;
    previewBundleHash: string;
  };
  slotInvocations: Array<{
    invocationIndex: number;
    invocationId: string;
    slotId: string;
    runtimeStatus: string;
    runtimeFinalState?: string;
    semanticOutcome?: string;
    projectionId?: string;
    runtimeRunId?: string;
    traceReferenceStatus: "available" | "unavailable";
    auditReferenceStatus: "available" | "unavailable";
  }>;
  decisions: {
    projections: Array<{
      invocationIndex: number;
      slotId: string;
      semanticOutcome: string;
      projectionId: string;
    }>;
    routes: Array<{ routeId: string; effect: string }>;
    bindings: Array<{ bindingId: string }>;
    overlays: Array<{
      overlayId: string;
      stage: string;
      decision: string;
    }>;
  };
  timeline: ScenarioEvidenceTimelineItem[];
  budgetUsage: {
    slotInvocations: number;
    routeEvaluations: number;
    bindingApplications: number;
  };
  auditSummary: {
    status: "available";
    redacted: true;
    externalEffectsOccurred: false;
  };
  redactionSummary: {
    redacted: true;
    completeInputIncluded: false;
    completeOutputIncluded: false;
    completeSlotTraceIncluded: false;
    completeAuditIncluded: false;
  };
  publicExposure: {
    mode: "demo_only";
    containsCustomerData: false;
    containsRealEndpoint: false;
    containsSecret: false;
    containsCustomerSop: false;
    containsCommercialDeliveryAsset: false;
  };
};

export type ScenarioRunEvidenceDraft = Omit<
  ScenarioRunEvidenceBundle,
  "evidenceHash"
>;

export type ScenarioEvidenceBlocker = {
  code: string;
  message: string;
};

export type ScenarioEvidenceIntegrityReport = {
  valid: boolean;
  integrityStatus: "valid" | "invalid";
  expectedHash?: string;
  actualHash?: string;
  blockers: ScenarioEvidenceBlocker[];
};

export type ScenarioEvidenceReplayResult = {
  valid: boolean;
  integrityStatus: "valid" | "invalid";
  runtimeExecuted: false;
  replayMode: "offline_evidence";
  timeline: ScenarioEvidenceTimelineItem[];
  slotTree: Array<{
    slotId: string;
    invocations: ScenarioRunEvidenceBundle["slotInvocations"];
  }>;
  projectionSummary: ScenarioRunEvidenceBundle["decisions"]["projections"];
  routeSummary: ScenarioRunEvidenceBundle["decisions"]["routes"];
  bindingSummary: ScenarioRunEvidenceBundle["decisions"]["bindings"];
  overlaySummary: ScenarioRunEvidenceBundle["decisions"]["overlays"];
  terminalSummary?: ScenarioRunEvidenceBundle["run"];
  budgetUsage?: ScenarioRunEvidenceBundle["budgetUsage"];
  auditSummary?: ScenarioRunEvidenceBundle["auditSummary"];
  blockers: ScenarioEvidenceBlocker[];
};
