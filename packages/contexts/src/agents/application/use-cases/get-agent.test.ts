import { describe, it, expect } from "vitest";
import { GetAgent } from "./get-agent";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { createTestDeps, seedOrganization } from "./_test-helpers";

describe("GetAgent", () => {
  it("returns agent when it belongs to the organization", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, { orgId: "org-1", ownerId: "user-1", ownerMemberId: "member-1" });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
    const { agent: created } = await createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    const getAgent = new GetAgent(deps.agentRepo);
    const agent = await getAgent.execute({ agentId: created.id, organizationId: "org-1" });

    expect(agent.id).toBe(created.id);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    const getAgent = new GetAgent(deps.agentRepo);

    await expect(
      getAgent.execute({ agentId: "non-existent", organizationId: "org-1" }),
    ).rejects.toThrow(AgentNotFoundError);
  });

  it("throws when agent belongs to different organization", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, { orgId: "org-1", ownerId: "user-1", ownerMemberId: "member-1" });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
    const { agent: created } = await createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    const getAgent = new GetAgent(deps.agentRepo);

    await expect(
      getAgent.execute({ agentId: created.id, organizationId: "org-other" }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
