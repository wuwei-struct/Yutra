export type ArtifactKind =
  | "agent"
  | "policy"
  | "adapter_config"
  | "templates"
  | "test_cases"
  | "trace_expectation";

export type CompiledArtifact<T> = {
  filename: string;
  kind: ArtifactKind;
  data: T;
  content: string;
  contentType: "text/yaml" | "application/json";
  hash: string;
};

export type RuleCompilerArtifacts = {
  agent: CompiledArtifact<string>;
  policy: CompiledArtifact<Record<string, unknown>>;
  adapterConfig: CompiledArtifact<Record<string, unknown>>;
  templates: CompiledArtifact<Record<string, unknown>>;
  testCases: CompiledArtifact<Record<string, unknown>>;
  traceExpectation: CompiledArtifact<Record<string, unknown>>;
};
