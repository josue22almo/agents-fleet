import { describe, it, expect } from "vitest";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { createTestDeps, seedOrganization } from "./_test-helpers";
import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { OrganizationNotFoundError } from "../../../iam/domain/errors/organization-not-found.error";
import { MemberRole } from "../../../iam/domain/value-objects/member-role";

describe("CreateAgent", () => {
  it("creates an agent and returns the raw token", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
    });
    const useCase = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);

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
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
      additionalMembers: [
        { memberId: "member-2", userId: "user-2", role: MemberRole.ADMIN },
      ],
    });
    const useCase = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);

    const result = await useCase.execute({
      name: "Admin Agent",
      type: AgentType.CUSTOM,
      organizationId: "org-1",
      userId: "user-2",
    });

    expect(result.agent.toPrimitives().name).toBe("Admin Agent");
  });

  it("rejects when user is a regular member", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
      additionalMembers: [
        { memberId: "member-2", userId: "user-2", role: MemberRole.MEMBER },
      ],
    });
    const useCase = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);

    await expect(
      useCase.execute({
        name: "Agent",
        type: AgentType.CLAUDE,
        organizationId: "org-1",
        userId: "user-2",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when organization does not exist", async () => {
    const deps = createTestDeps();
    const useCase = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);

    await expect(
      useCase.execute({
        name: "Agent",
        type: AgentType.CLAUDE,
        organizationId: "non-existent",
        userId: "user-1",
      }),
    ).rejects.toThrow(OrganizationNotFoundError);
  });

  it("publishes AgentCreatedEvent", async () => {
    const deps = createTestDeps();
    await seedOrganization(deps.orgRepo, {
      orgId: "org-1",
      ownerId: "user-1",
      ownerMemberId: "member-1",
    });
    const useCase = new CreateAgent(deps.agentRepo, deps.orgRepo, deps.idGenerator, deps.eventBus);

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
