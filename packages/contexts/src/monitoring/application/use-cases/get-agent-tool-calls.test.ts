import { describe, it, expect } from "vitest";
import { GetAgentToolCalls } from "./get-agent-tool-calls";
import { InMemoryToolCallRepository } from "../../infrastructure/persistence/in-memory-tool-call-repository";
import { ToolCall } from "../../domain/entities/tool-call";

describe("GetAgentToolCalls", () => {
  it("returns grouped tool call summaries", async () => {
    const repo = new InMemoryToolCallRepository();
    const now = new Date();

    await repo.save(
      ToolCall.create({
        id: "tc-1",
        runId: "run-1",
        agentId: "agent-1",
        toolName: "readFile",
        durationMs: 100,
        success: true,
        timestamp: now,
        createdAt: now,
      }),
    );
    await repo.save(
      ToolCall.create({
        id: "tc-2",
        runId: "run-1",
        agentId: "agent-1",
        toolName: "readFile",
        durationMs: 200,
        success: false,
        timestamp: now,
        createdAt: now,
      }),
    );
    await repo.save(
      ToolCall.create({
        id: "tc-3",
        runId: "run-1",
        agentId: "agent-1",
        toolName: "writeFile",
        durationMs: 50,
        success: true,
        timestamp: now,
        createdAt: now,
      }),
    );

    const useCase = new GetAgentToolCalls(repo);
    const result = await useCase.execute({ agentId: "agent-1" });

    expect(result).toHaveLength(2);

    const readFile = result.find((r) => r.toolName === "readFile");
    expect(readFile).toBeDefined();
    expect(readFile!.calls).toBe(2);
    expect(readFile!.avgDurationMs).toBe(150);
    expect(readFile!.successRate).toBe(0.5);

    const writeFile = result.find((r) => r.toolName === "writeFile");
    expect(writeFile).toBeDefined();
    expect(writeFile!.calls).toBe(1);
    expect(writeFile!.successRate).toBe(1);
  });

  it("returns empty array when no tool calls exist", async () => {
    const repo = new InMemoryToolCallRepository();
    const useCase = new GetAgentToolCalls(repo);
    const result = await useCase.execute({ agentId: "nonexistent" });
    expect(result).toEqual([]);
  });
});
