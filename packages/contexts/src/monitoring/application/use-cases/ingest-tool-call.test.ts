import { describe, it, expect } from "vitest";
import { IngestToolCall } from "./ingest-tool-call";
import { InMemoryToolCallRepository } from "../../infrastructure/persistence/in-memory-tool-call-repository";

describe("IngestToolCall", () => {
  it("creates and saves a tool call", async () => {
    const repo = new InMemoryToolCallRepository();
    let counter = 0;
    const idGenerator = { generate: () => `tc-${++counter}` };
    const useCase = new IngestToolCall(repo, idGenerator);

    const result = await useCase.execute({
      agentId: "agent-1",
      runId: "run-1",
      toolName: "readFile",
      durationMs: 200,
      success: true,
    });

    const p = result.toPrimitives();
    expect(p.id).toBe("tc-1");
    expect(p.toolName).toBe("readFile");
    expect(p.durationMs).toBe(200);
    expect(p.success).toBe(true);

    const saved = await repo.findByRunId("run-1");
    expect(saved).toHaveLength(1);
  });
});
