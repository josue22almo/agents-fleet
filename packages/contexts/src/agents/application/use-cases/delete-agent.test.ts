import { describe, it, expect } from "vitest";
import { DeleteAgent } from "./delete-agent";
import { CreateAgent } from "./create-agent";
import { ListAgents } from "./list-agents";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { createTestDeps } from "./_test-helpers";

describe("DeleteAgent", () => {
  async function setupWithAgent(deps: ReturnType<typeof createTestDeps>) {
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
    return createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });
  }

  it("soft deletes the agent (owner only)", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const deleteAgent = new DeleteAgent(deps.agentRepo, deps.iam);

    await deleteAgent.execute({
      agentId: created.id,
      userId: "user-1",
    });

    // Agent should not appear in list queries (soft deleted)
    const listAgents = new ListAgents(deps.agentRepo);
    const agents = await listAgents.execute("org-1");
    expect(agents).toHaveLength(0);
  });

  it("rejects when user is not owner", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const restrictedIAM: IAMContextPort = {
      canUserManageOrganization: async () => true,
      isUserOwnerOfOrganization: async () => false,
    };
    const deleteAgent = new DeleteAgent(deps.agentRepo, restrictedIAM);

    await expect(
      deleteAgent.execute({
        agentId: created.id,
        userId: "user-admin",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    const deleteAgent = new DeleteAgent(deps.agentRepo, deps.iam);

    await expect(
      deleteAgent.execute({
        agentId: "non-existent",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
