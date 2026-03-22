import { describe, it, expect } from "vitest";
import { UpdateAgent } from "./update-agent";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { createTestDeps } from "./_test-helpers";

describe("UpdateAgent", () => {
  async function setupWithAgent(deps: ReturnType<typeof createTestDeps>) {
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
    return createAgent.execute({
      name: "Original",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });
  }

  it("updates agent name when user can manage organization", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const updateAgent = new UpdateAgent(deps.agentRepo, deps.iam);

    const updated = await updateAgent.execute({
      agentId: created.id,
      name: "Renamed",
      userId: "user-1",
    });

    expect(updated.toPrimitives().name).toBe("Renamed");
  });

  it("rejects when user cannot manage organization", async () => {
    const deps = createTestDeps();
    const { agent: created } = await setupWithAgent(deps);
    const restrictedIAM: IAMContextPort = {
      canUserManageOrganization: async () => false,
      isUserOwnerOfOrganization: async () => false,
    };
    const updateAgent = new UpdateAgent(deps.agentRepo, restrictedIAM);

    await expect(
      updateAgent.execute({
        agentId: created.id,
        name: "Renamed",
        userId: "user-member",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when agent does not exist", async () => {
    const deps = createTestDeps();
    const updateAgent = new UpdateAgent(deps.agentRepo, deps.iam);

    await expect(
      updateAgent.execute({
        agentId: "non-existent",
        name: "Renamed",
        userId: "user-1",
      }),
    ).rejects.toThrow(AgentNotFoundError);
  });
});
