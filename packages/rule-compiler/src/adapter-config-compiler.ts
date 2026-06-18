import type { PackConfig } from "@yutra/pack-config-core";

export function compileAdapterConfigArtifact(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      configHash
    },
    adapters: config.adapters.map((adapter) => ({
      adapterId: adapter.adapterId,
      mode: adapter.mode,
      contractRef: adapter.contractRef,
      fieldMappings: adapter.fieldMappings ?? {},
      containsRealEndpoint: false,
      containsSecret: false
    })),
    replacementBoundary: "mock_or_real_placeholder_only",
    notes: [
      "This artifact is a public demo adapter config.",
      "Do not place real endpoints, credentials, or customer-specific mappings here."
    ]
  };
}
