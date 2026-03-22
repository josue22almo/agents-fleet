import { describe, it, expect } from "vitest";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { createTestDeps } from "./_test-helpers";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";

describe("CreateAgent", () => {
  it("creates an agent and returns the raw token", async () => {
    const deps = createTestDeps();
    const useCase = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);

    const result = await useCase.execute({
      name: "My Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(result.agent.toPrimitives().name).toBe("My Agent");
    expect(result.agent.isInactive).toBe(true);
    expect(result.token.value).toMatch(/^af_/);
  });

  it("allows admins to create agents", async () => {
    const deps = createTestDeps();
    const useCase = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);

    const result = await useCase.execute({
      name: "Admin Agent",
      type: AgentType.CUSTOM,
      organizationId: "org-1",
      userId: "user-2",
    });

    expect(result.agent.toPrimitives().name).toBe("Admin Agent");
  });

  it("rejects when user cannot manage organization", async () => {
    const deps = createTestDeps();
    const restrictedIAM: IAMContextPort = {
      canUserManageOrganization: async () => false,
      isUserOwnerOfOrganization: async () => false,
    };
    const useCase = new CreateAgent(deps.agentRepo, restrictedIAM, deps.idGenerator, deps.eventBus);

    await expect(
      useCase.execute({
        name: "Agent",
        type: AgentType.CLAUDE,
        organizationId: "org-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("publishes AgentCreatedEvent", async () => {
    const deps = createTestDeps();
    const useCase = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);

    await useCase.execute({
      name: "My Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(deps.eventBus.publishedEvents).toHaveLength(1);
    expect(deps.eventBus.publishedEvents[0]!.eventName).toBe("agents.agent.created");
  });
});
