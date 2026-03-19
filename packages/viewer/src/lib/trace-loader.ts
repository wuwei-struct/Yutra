import type { TraceEvent } from "../types";

export function parseJsonlTrace(text: string): TraceEvent[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("EMPTY_FILE");
  }

  const events: TraceEvent[] = [];

  for (const line of lines) {
    let parsed: TraceEvent;
    try {
      parsed = JSON.parse(line) as TraceEvent;
    } catch {
      throw new Error("INVALID_JSONL");
    }
    if (!parsed.runId || !parsed.id || !parsed.type || !parsed.ts) {
      continue;
    }
    events.push(parsed);
  }

  if (events.length === 0) {
    throw new Error("UNSUPPORTED_CONTENT");
  }

  return events;
}

export async function loadTraceFromFile(file: File): Promise<TraceEvent[]> {
  const text = await file.text();
  return parseJsonlTrace(text);
}

export async function loadTraceFromSample(samplePath: string): Promise<TraceEvent[]> {
  const response = await fetch(samplePath);
  if (!response.ok) {
    throw new Error("FAILED_TO_LOAD_TRACE_FILE");
  }

  const text = await response.text();
  return parseJsonlTrace(text);
}
