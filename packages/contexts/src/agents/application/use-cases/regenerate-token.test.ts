import { describe, it, expect } from "vitest";
import { RegenerateToken } from "./regenerate-token";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../../iam/domain/value-objects/member-role";
import { createTestDeps, seedOrganization } from "./_test-helpers";

describe("RegenerateToken", () => {
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
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });
  }

  it("regenerates token and returns the new raw token", async () => {
    const deps = createTestDeps();
    const { agent: created, token: originalToken } = await setupWithAgent(deps);
    const regenerateToken = new RegenerateToken(deps.agentRepo, deps.orgRepo);

    const result = await regenerateToken.execute({
      agentId: created.id,
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(result.token.value).toMatch(/^af_/);
    expect(result.token.hash).not.toBe(originalToken.hash);
    expect(result.agent.toPrimitives().tokenHash).toBe(result.token.hash);
  });

  it("rejects when user is a regular member", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const regenerateToken = new RegenerateToken(deps.agentRepo, deps.orgRepo);

    await expect(
      regenerateToken.execute({
        agentId: created.id,
        organizationId: "org-1",
        userId: "user-member",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, { orgId: "org-1", ownerId: "user-1", ownerMemberId: "member-1" });
    const regenerateToken = new RegenerateToken(deps.agentRepo, deps.orgRepo);

    await expect(
      regenerateToken.execute({
        agentId: "non-existent",
        organizationId: "org-1",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
