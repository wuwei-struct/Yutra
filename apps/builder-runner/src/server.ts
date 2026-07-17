import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { runBuilderPreview } from "./run-preview";
import { buildAiDraftPreview } from "./ai-draft-preview";
import { buildCreatorCompilePreview } from "./compile-preview";
import { inspectDslText } from "./dsl-inspect";
import type { AiDraftPreviewRequest, BuilderDslInspectRequest, BuilderRunPreviewRequest, CreatorCompilePreviewRequest } from "./types";
import { sanitizeErrorMessage } from "./response-formatters";
import {
  ScenarioCompositionApiError,
  compileBuiltInScenarioComposition,
  getScenarioCompositionDetail,
  listScenarioCompositionCatalog,
  parseScenarioCompositionCompileRequest
} from "./scenario-compositions";

const DEFAULT_PORT = 8788;

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  setCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody<T>(req: IncomingMessage, maxBytes = 1024 * 1024): Promise<T> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalBytes += buffer.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error(`Request body exceeds ${maxBytes} bytes.`);
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    throw new Error("Request body is empty.");
  }
  return JSON.parse(raw) as T;
}

function sendScenarioCompositionError(res: ServerResponse, error: unknown): void {
  if (error instanceof ScenarioCompositionApiError) {
    sendJson(res, error.statusCode, {
      ok: false,
      error: {
        code: error.code,
        message: sanitizeErrorMessage(error.message)
      },
      issues: []
    });
    return;
  }
  sendJson(res, 500, {
    ok: false,
    error: {
      code: "SCENARIO_COMPOSITION_INTERNAL_ERROR",
      message: "Scenario Composition request failed."
    },
    issues: []
  });
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new ScenarioCompositionApiError(
      "SCENARIO_COMPOSITION_REQUEST_INVALID",
      "Scenario Composition path contains invalid encoding.",
      400
    );
  }
}

async function handleRunPreview(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const request = await readJsonBody<BuilderRunPreviewRequest>(req);
    const result = await runBuilderPreview(request);
    sendJson(res, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: {
        code: "BUILDER_RUNNER_BAD_REQUEST",
        message: sanitizeErrorMessage(error instanceof Error ? error.message : "Invalid request.")
      },
      validation: {
        ok: false,
        issues: []
      },
      events: []
    });
  }
}

async function handleDslInspect(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const request = await readJsonBody<BuilderDslInspectRequest>(req);
    const result = inspectDslText(request);
    sendJson(res, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: {
        code: "DSL_INSPECT_BAD_REQUEST",
        message: sanitizeErrorMessage(error instanceof Error ? error.message : "Invalid DSL inspect request.")
      },
      validation: {
        ok: false,
        issues: []
      }
    });
  }
}

async function handleAiDraftPreview(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const request = await readJsonBody<AiDraftPreviewRequest>(req);
    const result = await buildAiDraftPreview(request);
    sendJson(res, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: {
        code: "AI_DRAFT_BAD_REQUEST",
        message: sanitizeErrorMessage(error instanceof Error ? error.message : "Invalid AI draft request.")
      },
      issues: [],
      meta: {
        providerMode: "mock",
        provider: "unknown",
        parsed: false,
        validated: false
      }
    });
  }
}

async function handleCreatorCompilePreview(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const request = await readJsonBody<CreatorCompilePreviewRequest>(req);
    const result = buildCreatorCompilePreview(request);
    sendJson(res, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: {
        code: "CREATOR_COMPILE_BAD_REQUEST",
        message: sanitizeErrorMessage(error instanceof Error ? error.message : "Invalid creator compile preview request.")
      },
      issues: []
    });
  }
}

function handleScenarioCompositionCatalog(res: ServerResponse): void {
  try {
    sendJson(res, 200, listScenarioCompositionCatalog());
  } catch (error) {
    sendScenarioCompositionError(res, error);
  }
}

function handleScenarioCompositionDetail(res: ServerResponse, compositionId: string): void {
  try {
    sendJson(res, 200, getScenarioCompositionDetail(compositionId));
  } catch (error) {
    sendScenarioCompositionError(res, error);
  }
}

async function handleScenarioCompositionCompilePreview(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const input = await readJsonBody<unknown>(req, 4096);
    const request = parseScenarioCompositionCompileRequest(input);
    const result = compileBuiltInScenarioComposition(request);
    const statusCode = result.ok ? 200 : result.error.code === "COMPOSITION_NOT_COMPILE_READY" ? 422 : 400;
    sendJson(res, statusCode, result);
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message.startsWith("Request body"))) {
      sendJson(res, 400, {
        ok: false,
        error: {
          code: "SCENARIO_COMPOSITION_REQUEST_INVALID",
          message: sanitizeErrorMessage(error.message)
        },
        issues: []
      });
      return;
    }
    sendScenarioCompositionError(res, error);
  }
}

function requestHandler(req: IncomingMessage, res: ServerResponse): void {
  const method = req.method ?? "GET";
  const path = (req.url ?? "/").split("?")[0];

  if (method === "OPTIONS") {
    setCorsHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (method === "GET" && path === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "yutra-builder-runner"
    });
    return;
  }

  if (method === "POST" && path === "/run-preview") {
    void handleRunPreview(req, res);
    return;
  }

  if (method === "POST" && path === "/dsl/inspect") {
    void handleDslInspect(req, res);
    return;
  }

  if (method === "POST" && path === "/ai-draft-preview") {
    void handleAiDraftPreview(req, res);
    return;
  }

  if (method === "POST" && path === "/creator/compile-preview") {
    void handleCreatorCompilePreview(req, res);
    return;
  }

  if (method === "GET" && path === "/creator/scenario-compositions") {
    handleScenarioCompositionCatalog(res);
    return;
  }

  const scenarioDetailMatch = path.match(/^\/creator\/scenario-compositions\/([^/]+)$/);
  if (method === "GET" && scenarioDetailMatch) {
    try {
      handleScenarioCompositionDetail(res, decodePathSegment(scenarioDetailMatch[1] ?? ""));
    } catch (error) {
      sendScenarioCompositionError(res, error);
    }
    return;
  }

  if (method === "POST" && path === "/creator/scenario-compositions/compile-preview") {
    void handleScenarioCompositionCompilePreview(req, res);
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: {
      code: "BUILDER_RUNNER_NOT_FOUND",
      message: "Route not found."
    }
  });
}

export function createBuilderRunnerServer(): Server {
  return createServer(requestHandler);
}

export async function startBuilderRunnerServer(port = DEFAULT_PORT): Promise<Server> {
  const server = createBuilderRunnerServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
  return server;
}

const invokedScript = process.argv[1] ?? "";
const shouldAutoStart = Boolean(invokedScript.match(/server\.(ts|js)$/)) && !process.env.VITEST;
if (shouldAutoStart) {
  void startBuilderRunnerServer().then(() => {
    console.log("yutra-builder-runner listening on http://127.0.0.1:8788");
  });
}
