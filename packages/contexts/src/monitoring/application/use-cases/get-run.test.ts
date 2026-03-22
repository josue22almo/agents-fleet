import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunNotFoundError } from "../../domain/errors/run-not-found.error";
import { createTestDeps } from "./_test-helpers";
import { GetRun } from "./get-run";

describe("GetRun", () => {
  it("returns a run by id", async () => {
    const deps = createTestDeps();
    const getRun = new GetRun(deps.runRepo);

    const run = Run.start({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
    });
    await deps.runRepo.save(run);

    const found = await getRun.execute("run-1");
    expect(found.id).toBe("run-1");
  });

  it("throws RunNotFoundError when run does not exist", async () => {
    const deps = createTestDeps();
    const getRun = new GetRun(deps.runRepo);

    await expect(getRun.execute("nonexistent")).rejects.toThrow(RunNotFoundError);
  });
});
