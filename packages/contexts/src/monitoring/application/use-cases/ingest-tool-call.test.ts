import { describe, it, expect } from "vitest";
import { IngestToolCall } from "./ingest-tool-call";
import { InMemoryToolCallRepository } from "../../infrastructure/persistence/in-memory-tool-call-repository";
import { InMemoryRunRepository } from "../../infrastructure/persistence/in-memory-run-repository";
import { Run } from "../../domain/entities/run";

describe("IngestToolCall", () => {
  it("creates tool call and resolves external run ID to UUID", async () => {
    const toolCallRepo = new InMemoryToolCallRepository();
    const runRepo = new InMemoryRunRepository();
    let counter = 0;
    const idGenerator = { generate: () => `tc-${++counter}` };

    // Create a run so the external ID can be resolved
    const run = Run.start({ id: "uuid-run-1", agentId: "agent-1", externalRunId: "ext-run-1" });
    await runRepo.save(run);

    const useCase = new IngestToolCall(toolCallRepo, runRepo, idGenerator);

    const result = await useCase.execute({
      agentId: "agent-1",
      externalRunId: "ext-run-1",
      toolName: "readFile",
      durationMs: 200,
      success: true,
    });

    const p = result.toPrimitives();
    expect(p.id).toBe("tc-1");
    expect(p.runId).toBe("uuid-run-1");
    expect(p.toolName).toBe("readFile");
    expect(p.durationMs).toBe(200);
    expect(p.success).toBe(true);
  });

  it("saves tool call with null runId when external run not found", async () => {
    const toolCallRepo = new InMemoryToolCallRepository();
    const runRepo = new InMemoryRunRepository();
    let counter = 0;
    const idGenerator = { generate: () => `tc-${++counter}` };
    const useCase = new IngestToolCall(toolCallRepo, runRepo, idGenerator);

    const result = await useCase.execute({
      agentId: "agent-1",
      externalRunId: "nonexistent-run",
      toolName: "writeFile",
    });

    const p = result.toPrimitives();
    expect(p.runId).toBeNull();
    expect(p.toolName).toBe("writeFile");
  });
});
