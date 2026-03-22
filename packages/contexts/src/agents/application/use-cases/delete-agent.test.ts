import { describe, it, expect } from "vitest";
import { DeleteAgent } from "./delete-agent";
import { CreateAgent } from "./create-agent";
import { ListAgents } from "./list-agents";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../../iam/domain/value-objects/member-role";
import { createTestDeps, seedOrganization } from "./_test-helpers";

describe("DeleteAgent", () => {
  async function setupWithAgent(deps: ReturnType<typeof createTestDeps>) {
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
      additionalMembers: [
        { memberId: "member-2", userId: "user-admin", role: MemberRole.ADMIN },
      ],
    });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
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
    const deleteAgent = new DeleteAgent(deps.agentRepo, deps.orgRepo);

    await deleteAgent.execute({
      agentId: created.id,
      organizationId: "org-1",
      userId: "user-1",
    });

    // Agent should not appear in list queries (soft deleted)
    const listAgents = new ListAgents(deps.agentRepo);
    const agents = await listAgents.execute("org-1");
    expect(agents).toHaveLength(0);
  });

  it("rejects when user is admin (not owner)", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const deleteAgent = new DeleteAgent(deps.agentRepo, deps.orgRepo);

    await expect(
      deleteAgent.execute({
        agentId: created.id,
        organizationId: "org-1",
        userId: "user-admin",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, { orgId: "org-1", ownerId: "user-1", ownerMemberId: "member-1" });
    const deleteAgent = new DeleteAgent(deps.agentRepo, deps.orgRepo);

    await expect(
      deleteAgent.execute({
        agentId: "non-existent",
        organizationId: "org-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
