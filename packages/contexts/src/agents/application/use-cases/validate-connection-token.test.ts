import { describe, it, expect } from "vitest";
import { ValidateConnectionToken } from "./validate-connection-token";
import { CreateAgent } from "./create-agent";
import { AgentType } from "../../domain/value-objects/agent-type";
import { InvalidConnectionTokenError } from "../../domain/errors/invalid-connection-token.error";
import { createTestDeps } from "./_test-helpers";

describe("ValidateConnectionToken", () => {
  it("returns agentId and organizationId for a valid token", async () => {
    const deps = createTestDeps();
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
    const { agent, token } = await createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    const validate = new ValidateConnectionToken(deps.agentRepo);
    const result = await validate.execute(token.value);

    expect(result.agentId).toBe(agent.id);
    expect(result.organizationId).toBe("org-1");
  });

  it("throws for an invalid token", async () => {
    const deps = createTestDeps();
    const validate = new ValidateConnectionToken(deps.agentRepo);

    await expect(validate.execute("af_invalid_token")).rejects.toThrow(
      InvalidConnectionTokenError,
    );
  });

  it("throws for a deleted agent's token", async () => {
    const deps = createTestDeps();
    const createAgent = new CreateAgent(deps.agentRepo, deps.iam, deps.idGenerator, deps.eventBus);
    const { agent, token } = await createAgent.execute({
      name: "Agent",
      type: AgentType.CLAUDE,
      organizationId: "org-1",
      userId: "user-1",
    });

    // Soft delete the agent
    agent.softDelete();
    await deps.agentRepo.save(agent);

    const validate = new ValidateConnectionToken(deps.agentRepo);
    await expect(validate.execute(token.value)).rejects.toThrow(
      InvalidConnectionTokenError,
    );
  });
});
