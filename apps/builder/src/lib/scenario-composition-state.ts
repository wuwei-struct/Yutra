import { useCallback, useEffect, useState } from "react";
import type {
  ScenarioCompositionCatalogItem,
  ScenarioCompositionCompileResult,
  ScenarioCompositionDetailResponse
} from "../types";
import {
  compileScenarioCompositionPreview,
  fetchScenarioCompositionCatalog,
  fetchScenarioCompositionDetail
} from "./scenario-composition-client";

const DEFAULT_COMPOSITION_ID = "customer-complaint-composition-demo";

export function useScenarioCompositionState() {
  const [catalog, setCatalog] = useState<ScenarioCompositionCatalogItem[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<string>("");
  const [detail, setDetail] = useState<ScenarioCompositionDetailResponse | undefined>();
  const [compileResult, setCompileResult] = useState<ScenarioCompositionCompileResult | undefined>();
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [compileLoading, setCompileLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [compileError, setCompileError] = useState<{ code: string; message: string } | undefined>();

  useEffect(() => {
    let active = true;
    void fetchScenarioCompositionCatalog()
      .then((items) => {
        if (!active) return;
        setCatalog(items);
        const preferred = items.some((item) => item.compositionId === DEFAULT_COMPOSITION_ID)
          ? DEFAULT_COMPOSITION_ID
          : items[0]?.compositionId ?? "";
        setSelectedCompositionId(preferred);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Scenario Composition catalog failed.");
        }
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompositionId) return;
    let active = true;
    setDetailLoading(true);
    setError("");
    setDetail(undefined);
    setCompileResult(undefined);
    setCompileError(undefined);
    void fetchScenarioCompositionDetail(selectedCompositionId)
      .then((value) => {
        if (active) setDetail(value);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Scenario Composition detail failed.");
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCompositionId]);

  const selectComposition = useCallback((compositionId: string) => {
    setSelectedCompositionId(compositionId);
    setCompileResult(undefined);
    setCompileError(undefined);
  }, []);

  const compilePreview = useCallback(async () => {
    if (!detail?.eligibleForCompilePreview) return;
    setCompileLoading(true);
    setCompileResult(undefined);
    setCompileError(undefined);
    try {
      const response = await compileScenarioCompositionPreview(detail.compositionId);
      if (response.ok) {
        setCompileResult(response.result);
      } else {
        setCompileError(response.error);
      }
    } catch (requestError) {
      setCompileError({
        code: "SCENARIO_COMPOSITION_CLIENT_ERROR",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Scenario Composition Compile Preview failed."
      });
    } finally {
      setCompileLoading(false);
    }
  }, [detail]);

  return {
    catalog,
    selectedCompositionId,
    detail,
    compileResult,
    catalogLoading,
    detailLoading,
    compileLoading,
    error,
    compileError,
    selectComposition,
    compilePreview
  };
}
