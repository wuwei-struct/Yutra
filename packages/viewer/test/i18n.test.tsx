/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";
import { I18nProvider } from "../src/i18n";
import { LOCALE_STORAGE_KEY } from "../src/i18n/locale";
import { parseJsonlTrace } from "../src/lib/trace-loader";
import type { TraceEvent } from "../src/types";

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", {
    value: language,
    configurable: true
  });
}

describe("viewer i18n", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("viewer defaults to zh-CN when browser language is zh", () => {
    setNavigatorLanguage("zh-CN");

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(screen.getByText("运行列表")).toBeTruthy();
  });

  it("viewer defaults to en when browser language is non-zh", () => {
    setNavigatorLanguage("en-US");

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(screen.getByText("Run List")).toBeTruthy();
  });

  it("language switch updates UI labels", () => {
    render(
      <I18nProvider initialLocale="en">
        <App />
      </I18nProvider>
    );

    expect(screen.getByText("Run List")).toBeTruthy();

    fireEvent.change(screen.getByTestId("locale-select"), {
      target: { value: "zh-CN" }
    });

    expect(screen.getByText("运行列表")).toBeTruthy();
  });

  it("selected locale persists to localStorage", () => {
    render(
      <I18nProvider initialLocale="en">
        <App />
      </I18nProvider>
    );

    fireEvent.change(screen.getByTestId("locale-select"), {
      target: { value: "zh-CN" }
    });

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-CN");
  });

  it("switching locale does not alter underlying event type rendering logic", () => {
    const events: TraceEvent[] = [
      {
        id: "r1-1",
        runId: "r1",
        type: "run.started",
        ts: "2026-03-18T00:00:00.000Z",
        agent: "it-helpdesk-agent"
      },
      {
        id: "r1-2",
        runId: "r1",
        type: "action.succeeded",
        ts: "2026-03-18T00:00:01.000Z",
        state: "triage",
        action: "lookup_ticket",
        payload: { output: { found: true } }
      }
    ];

    render(
      <I18nProvider initialLocale="en">
        <App initialEvents={events} />
      </I18nProvider>
    );

    expect(screen.getByText("action.succeeded (lookup_ticket)")).toBeTruthy();

    fireEvent.change(screen.getByTestId("locale-select"), {
      target: { value: "zh-CN" }
    });

    expect(screen.getByText("action.succeeded (lookup_ticket)")).toBeTruthy();
  });

  it("sample JSONL still loads normally after i18n changes", () => {
    const jsonl =
      '{"id":"r1-1","runId":"r1","type":"run.started","ts":"2026-03-18T00:00:00.000Z"}\n' +
      '{"id":"r1-2","runId":"r1","type":"run.completed","ts":"2026-03-18T00:00:01.000Z"}';

    const events = parseJsonlTrace(jsonl);
    expect(events.length).toBe(2);
  });
});
