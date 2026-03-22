import { describe, it, expect } from "vitest";
import { UpdateAgent } from "./update-agent";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../../iam/domain/value-objects/member-role";
import { createTestDeps, seedOrganization } from "./_test-helpers";

describe("UpdateAgent", () => {
  async function setupWithAgent(deps: ReturnType<typeof createTestDeps>) {
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
      additionalMembers: [
        { memberId: "member-2", userId: "user-member", role: MemberRole.MEMBER },
      ],
    });
    const createAgent = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);
    return createAgent.execute({
      name: "Original",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });
  }

  it("updates agent name when user is owner", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const updateAgent = new UpdateAgent(deps.agentRepo, deps.orgRepo);

    const updated = await updateAgent.execute({
      agentId: created.id,
      name: "Renamed",
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(updated.toPrimitives().name).toBe("Renamed");
  });

  it("rejects when user is a regular member", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const updateAgent = new UpdateAgent(deps.agentRepo, deps.orgRepo);

    await expect(
      updateAgent.execute({
        agentId: created.id,
        name: "Renamed",
        organizationId: "org-1",
        userId: "user-member",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, { orgId: "org-1", ownerId: "user-1", ownerMemberId: "member-1" });
    const updateAgent = new UpdateAgent(deps.agentRepo, deps.orgRepo);

    await expect(
      updateAgent.execute({
        agentId: "non-existent",
        name: "Renamed",
        organizationId: "org-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
