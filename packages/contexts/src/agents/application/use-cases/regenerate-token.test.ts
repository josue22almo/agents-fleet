import { describe, it, expect } from "vitest";
import { RegenerateToken } from "./regenerate-token";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { createTestDeps } from "./_test-helpers";

describe("RegenerateToken", () => {
  async function setupWithAgent(deps: ReturnType<typeof createTestDeps>) {
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
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
    const regenerateToken = new RegenerateToken(deps.agentRepo, deps.iam);

    const result = await regenerateToken.execute({
      agentId: created.id,
      userId: "user-1",
    });

    expect(result.token.value).toMatch(/^af_/);
    expect(result.token.hash).not.toBe(originalToken.hash);
    expect(result.agent.toPrimitives().tokenHash).toBe(result.token.hash);
  });

  it("rejects when user cannot manage organization", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const restrictedIAM: IAMContextPort = {
      canUserManageOrganization: async () => false,
      isUserOwnerOfOrganization: async () => false,
    };
    const regenerateToken = new RegenerateToken(deps.agentRepo, restrictedIAM);

    await expect(
      regenerateToken.execute({
        agentId: created.id,
        userId: "user-member",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    const regenerateToken = new RegenerateToken(deps.agentRepo, deps.iam);

    await expect(
      regenerateToken.execute({
        agentId: "non-existent",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
