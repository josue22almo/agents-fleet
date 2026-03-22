import { describe, it, expect } from "vitest";
import { ListAgents } from "./list-agents";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { createTestDeps, seedOrganization } from "./_test-helpers";

describe("ListAgents", () => {
  it("returns agents for a given organization", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
    });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
    await createAgent.execute({ name: "Agent 1", type: AgentType.CLAUDE, organizationId: "org-1", userId: "user-1" });
    await createAgent.execute({ name: "Agent 2", type: AgentType.MANUS, organizationId: "org-1", userId: "user-1" });

    const listAgents = new ListAgents(deps.agentRepo);
    const agents = await listAgents.execute("org-1");

    expect(agents).toHaveLength(2);
  });

  it("returns empty array when no agents exist", async () => {
    const deps = createTestDeps();
    const listAgents = new ListAgents(deps.agentRepo);
    const agents = await listAgents.execute("org-1");
    expect(agents).toHaveLength(0);
  });

  it("does not return agents from other organizations", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
    });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
    await createAgent.execute({ name: "Agent 1", type: AgentType.CLAUDE, organizationId: "org-1", userId: "user-1" });

    const listAgents = new ListAgents(deps.agentRepo);
    const agents = await listAgents.execute("org-2");

    expect(agents).toHaveLength(0);
  });
});
