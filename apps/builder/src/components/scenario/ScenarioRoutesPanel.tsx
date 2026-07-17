import { useI18n } from "../../i18n";
import type { ScenarioCompositionRoute } from "../../types";

export function ScenarioRoutesPanel(props: { routes: ScenarioCompositionRoute[] }) {
  const { t } = useI18n();
  return (
    <section className="scenario-detail-panel" aria-label="Composition Routes">
      <h3>{t("scenario.routes")}</h3>
      <div className="scenario-table-wrap">
        <table>
          <thead>
            <tr><th>routeId</th><th>from</th><th>to</th><th>trigger</th><th>conditionRef</th><th>returnMode</th></tr>
          </thead>
          <tbody>
            {props.routes.map((route) => (
              <tr key={route.routeId}>
                <td>{route.routeId}</td><td>{route.fromSlotId}</td><td>{route.toSlotId}</td>
                <td>{route.trigger}</td><td>{route.conditionRef}</td><td>{route.returnMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
