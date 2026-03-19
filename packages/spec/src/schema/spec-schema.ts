import { z } from "zod";

export const contextFieldTypeSchema = z.enum(["string", "number", "boolean", "object", "array", "any"]);

export const intentSpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entry_state: z.string().min(1).optional()
});

export const contextFieldSpecSchema = z.object({
  type: contextFieldTypeSchema.optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  default: z.unknown().optional()
});

export const contextSpecSchema = z.object({
  fields: z.record(z.string(), contextFieldSpecSchema).optional()
});

export const transitionSpecSchema = z.object({
  to: z.string().min(1),
  when: z.string().optional(),
  guard: z.string().optional(),
  description: z.string().optional()
});

export const stateSpecSchema = z.object({
  description: z.string().optional(),
  actions: z.array(z.string().min(1)).optional(),
  guards: z.array(z.string().min(1)).optional(),
  transitions: z.array(transitionSpecSchema).optional(),
  on_enter: z.array(z.string().min(1)).optional(),
  on_exit: z.array(z.string().min(1)).optional(),
  final: z.boolean().optional(),
  handoff: z.boolean().optional()
});

export const actionSideEffectSchema = z.enum(["none", "read", "write", "external"]);

export const actionSpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  side_effect: actionSideEffectSchema.optional()
});

export const guardSpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  expression: z.string().optional(),
  required: z.boolean().optional()
});

export const agentSpecSchema = z.object({
  agent: z.string().min(1),
  version: z.string().optional(),
  intents: z.array(intentSpecSchema).optional(),
  context: contextSpecSchema.optional(),
  initial_state: z.string().min(1),
  states: z.record(z.string(), stateSpecSchema),
  actions: z.array(actionSpecSchema).optional(),
  guards: z.array(guardSpecSchema).optional()
});

export const traceEventTypeSchema = z.enum([
  "run.started",
  "intent.resolved",
  "state.entered",
  "guard.evaluated",
  "action.started",
  "action.succeeded",
  "action.failed",
  "transition.resolved",
  "state.exited",
  "run.completed",
  "run.failed",
  "handoff.requested"
]);

export const traceEventSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  type: traceEventTypeSchema,
  ts: z.string().min(1),
  agent: z.string().optional(),
  state: z.string().optional(),
  action: z.string().optional(),
  transition: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional()
});
