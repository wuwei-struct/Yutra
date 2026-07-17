import type { ScenarioCompositionPlanView } from "../../types";
import { ScenarioBindingsPanel } from "./ScenarioBindingsPanel";
import { ScenarioOverlaysPanel } from "./ScenarioOverlaysPanel";
import { ScenarioPrecedencePanel } from "./ScenarioPrecedencePanel";
import { ScenarioRoutesPanel } from "./ScenarioRoutesPanel";

export function ScenarioPlanPreviewPanel(props: { plan: ScenarioCompositionPlanView }) {
  if (!props.plan.slots) {
    return (
      <section className="scenario-panel" aria-label="Contract Only Composition Plan">
        <h2>Contract-only composition draft</h2>
        <p className="warning-text">{props.plan.blockers?.join("; ")}</p>
      </section>
    );
  }
  return (
    <section className="scenario-plan-panels" aria-label="Composition Plan Details">
      <ScenarioRoutesPanel routes={props.plan.routes ?? []} />
      <ScenarioBindingsPanel bindings={props.plan.dataBindings ?? []} />
      <ScenarioOverlaysPanel overlays={props.plan.crossCuttingOverlays ?? []} />
      <ScenarioPrecedencePanel precedence={props.plan.precedencePolicy} />
    </section>
  );
}
