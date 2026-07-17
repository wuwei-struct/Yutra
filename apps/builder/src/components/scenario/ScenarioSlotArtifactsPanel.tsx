import { useState } from "react";
import { useI18n } from "../../i18n";
import type { CompiledScenarioCompositionSlot, ScenarioCompositionCompileResult } from "../../types";
import { SLOT_ARTIFACT_FILENAMES } from "./scenario-composition-ui";

export interface ScenarioSlotDslMetadata {
  compositionId: string;
  slotId: string;
  archetypeId: string;
  configHash: string;
  compilerVersion: string;
  artifactHash?: string;
}

export function ScenarioSlotArtifactsPanel(props: {
  result: ScenarioCompositionCompileResult;
  onSendSlotDsl: (dslText: string, metadata: ScenarioSlotDslMetadata) => void;
}) {
  const { t } = useI18n();
  const [selectedSlotId, setSelectedSlotId] = useState(props.result.slots[0]?.slotId ?? "");
  const [selectedFilename, setSelectedFilename] = useState<string>(SLOT_ARTIFACT_FILENAMES[0]);
  const selectedSlot: CompiledScenarioCompositionSlot | undefined =
    props.result.slots.find((slot) => slot.slotId === selectedSlotId) ?? props.result.slots[0];

  return (
    <section className="scenario-panel scenario-slot-artifacts" aria-label="Slot Artifacts">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.namespacedConfigs")}</p>
          <h2>{t("scenario.slotArtifacts")}</h2>
        </div>
        <span className="status-pill">{selectedSlot?.namespace}</span>
      </div>
      <div className="scenario-slot-tabs">
        {props.result.slots.map((slot) => (
          <button
            type="button"
            key={slot.slotId}
            className={selectedSlot?.slotId === slot.slotId ? "scenario-slot-tab active" : "scenario-slot-tab"}
            onClick={() => {
              setSelectedSlotId(slot.slotId);
              setSelectedFilename(SLOT_ARTIFACT_FILENAMES[0]);
            }}
          >
            <strong>{slot.slotId}</strong>
            <span>{slot.role}</span>
            <code>{slot.archetypeId}</code>
          </button>
        ))}
      </div>
      {selectedSlot ? (
        <>
          <dl className="scenario-compile-summary">
            <dt>slotId</dt><dd>{selectedSlot.slotId}</dd>
            <dt>role</dt><dd>{selectedSlot.role}</dd>
            <dt>archetypeId</dt><dd>{selectedSlot.archetypeId}</dd>
            <dt>packConfigId</dt><dd>{selectedSlot.packConfigId}</dd>
            <dt>configHash</dt><dd>{selectedSlot.configHash}</dd>
          </dl>
          <div className="tabs wrap-tabs">
            {SLOT_ARTIFACT_FILENAMES.map((filename) => (
              <button
                type="button"
                key={filename}
                className={selectedFilename === filename ? "tab active" : "tab"}
                onClick={() => setSelectedFilename(filename)}
              >
                {filename}
              </button>
            ))}
          </div>
          <pre aria-label="Slot Artifact Content">{selectedSlot.artifacts[selectedFilename]}</pre>
          {selectedFilename === "agent.yutra.yaml" ? (
            <div className="scenario-slot-send">
              <p>{t("scenario.slotDslNotice")}</p>
              <button
                type="button"
                onClick={() =>
                  props.onSendSlotDsl(selectedSlot.artifacts["agent.yutra.yaml"] ?? "", {
                    compositionId: props.result.compositionId,
                    slotId: selectedSlot.slotId,
                    archetypeId: selectedSlot.archetypeId,
                    configHash: selectedSlot.configHash,
                    compilerVersion: props.result.compositionCompilerVersion,
                    artifactHash: selectedSlot.artifactHashes["agent.yutra.yaml"]
                  })
                }
              >
                {t("scenario.sendSlotDsl")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
