import { describe, it, expect } from "vitest";
import { ToolCall } from "./tool-call";

describe("ToolCall", () => {
  it("creates a tool call with record()", () => {
    const tc = ToolCall.record({
      id: "tc-1",
      runId: "run-1",
      agentId: "agent-1",
      toolName: "readFile",
      durationMs: 150,
      success: true,
    });

    const p = tc.toPrimitives();
    expect(p.id).toBe("tc-1");
    expect(p.runId).toBe("run-1");
    expect(p.agentId).toBe("agent-1");
    expect(p.toolName).toBe("readFile");
    expect(p.durationMs).toBe(150);
    expect(p.success).toBe(true);
    expect(p.timestamp).toBeInstanceOf(Date);
    expect(p.createdAt).toBeInstanceOf(Date);
  });

  it("defaults success to true and durationMs to null", () => {
    const tc = ToolCall.record({
      id: "tc-2",
      runId: "run-2",
      agentId: "agent-2",
      toolName: "writeFile",
    });

    const p = tc.toPrimitives();
    expect(p.success).toBe(true);
    expect(p.durationMs).toBeNull();
  });

  it("creates from explicit props via create()", () => {
    const now = new Date();
    const tc = ToolCall.create({
      id: "tc-3",
      runId: "run-3",
      agentId: "agent-3",
      toolName: "search",
      durationMs: 300,
      success: false,
      timestamp: now,
      createdAt: now,
    });

    const p = tc.toPrimitives();
    expect(p.success).toBe(false);
    expect(p.durationMs).toBe(300);
    expect(p.timestamp).toBe(now);
  });
});
