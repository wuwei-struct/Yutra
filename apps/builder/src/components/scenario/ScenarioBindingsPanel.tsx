import { useI18n } from "../../i18n";
import type { ScenarioCompositionBinding } from "../../types";

export function ScenarioBindingsPanel(props: { bindings: ScenarioCompositionBinding[] }) {
  const { t } = useI18n();
  return (
    <section className="scenario-detail-panel" aria-label="Composition Data Bindings">
      <h3>{t("scenario.bindings")}</h3>
      <div className="scenario-table-wrap">
        <table>
          <thead>
            <tr><th>bindingId</th><th>from</th><th>to</th><th>required</th><th>transform</th></tr>
          </thead>
          <tbody>
            {props.bindings.map((binding) => (
              <tr key={binding.bindingId}>
                <td>{binding.bindingId}</td>
                <td>{`${binding.fromSlotId}.${binding.fromPath}`}</td>
                <td>{`${binding.toSlotId}.${binding.toPath}`}</td>
                <td>{String(binding.required)}</td>
                <td>{binding.transform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
