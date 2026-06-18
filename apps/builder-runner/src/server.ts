import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { runBuilderPreview } from "./run-preview";
import { buildAiDraftPreview } from "./ai-draft-preview";
import { inspectDslText } from "./dsl-inspect";
import type { AiDraftPreviewRequest, BuilderDslInspectRequest, BuilderRunPreviewRequest } from "./types";
import { sanitizeErrorMessage } from "./response-formatters";

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

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    throw new Error("Request body is empty.");
  }
  return JSON.parse(raw) as T;
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
