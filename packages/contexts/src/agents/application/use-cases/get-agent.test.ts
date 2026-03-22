import { describe, it, expect } from "vitest";
import { GetAgent } from "./get-agent";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { createTestDeps } from "./_test-helpers";

describe("GetAgent", () => {
  it("returns agent by id", async () => {
    const deps = createTestDeps();
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
    const { agent: created } = await createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    const getAgent = new GetAgent(deps.agentRepo);
    const agent = await getAgent.execute({ agentId: created.id });

    expect(agent.id).toBe(created.id);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    const getAgent = new GetAgent(deps.agentRepo);

    await expect(
      getAgent.execute({ agentId: "non-existent" }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
