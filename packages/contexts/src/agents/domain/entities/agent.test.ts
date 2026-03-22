import { describe, it, expect } from "vitest";
import { Agent } from "./agent";
import { AgentType } from "../value-objects/agent-type";
import { AgentStatus } from "../value-objects/agent-status";
import { ConnectionToken } from "../value-objects/connection-token";

describe("Agent", () => {
  function createAgent() {
    return Agent.createNew({
      id: "agent-1",
      organizationId: "org-1",
      name: "My Claude Agent",
      type: AgentType.CLAUDE,
      createdBy: "user-1",
    });
  }

  it("creates a new agent with inactive status", () => {
    const { agent } = createAgent();
    expect(agent.isInactive).toBe(true);
    expect(agent.isActive).toBe(false);
    expect(agent.isDeleted).toBe(false);
  });

  it("generates a connection token on creation", () => {
    const { agent, token } = createAgent();
    expect(token.value).toMatch(/^af_/);
    expect(token.hash.length).toBe(64);
    const primitives = agent.toPrimitives();
    expect(primitives.tokenHash).toBe(token.hash);
    expect(primitives.tokenPrefix).toBe(token.prefix);
  });

  it("serializes to primitives", () => {
    const { agent } = createAgent();
    const p = agent.toPrimitives();
    expect(p.id).toBe("agent-1");
    expect(p.organizationId).toBe("org-1");
    expect(p.name).toBe("My Claude Agent");
    expect(p.type).toBe(AgentType.CLAUDE);
    expect(p.status).toBe(AgentStatus.INACTIVE);
    expect(p.createdBy).toBe("user-1");
    expect(p.lastSeenAt).toBeNull();
    expect(p.deletedAt).toBeNull();
  });

  it("updates name", () => {
    const { agent } = createAgent();
    agent.updateName("Renamed Agent");
    expect(agent.toPrimitives().name).toBe("Renamed Agent");
  });

  it("marks as active", () => {
    const { agent } = createAgent();
    agent.markActive();
    expect(agent.isActive).toBe(true);
    expect(agent.isInactive).toBe(false);
  });

  it("marks as inactive", () => {
    const { agent } = createAgent();
    agent.markActive();
    agent.markInactive();
    expect(agent.isInactive).toBe(true);
  });

  it("updates last seen timestamp", () => {
    const { agent } = createAgent();
    expect(agent.toPrimitives().lastSeenAt).toBeNull();
    agent.updateLastSeen();
    expect(agent.toPrimitives().lastSeenAt).toBeInstanceOf(Date);
  });

  it("regenerates token", () => {
    const { agent, token: originalToken } = createAgent();
    const newToken = agent.regenerateToken();
    expect(newToken.hash).not.toBe(originalToken.hash);
    expect(agent.toPrimitives().tokenHash).toBe(newToken.hash);
    expect(agent.toPrimitives().tokenPrefix).toBe(newToken.prefix);
  });

  it("verifies token", () => {
    const { agent, token } = createAgent();
    expect(agent.verifyToken(token.value)).toBe(true);
    expect(agent.verifyToken("wrong-token")).toBe(false);
  });

  it("soft deletes", () => {
    const { agent } = createAgent();
    agent.softDelete();
    expect(agent.isDeleted).toBe(true);
    expect(agent.isInactive).toBe(true);
    expect(agent.toPrimitives().deletedAt).toBeInstanceOf(Date);
  });

  it("checks organization membership", () => {
    const { agent } = createAgent();
    expect(agent.belongsToOrganization("org-1")).toBe(true);
    expect(agent.belongsToOrganization("org-other")).toBe(false);
  });

  it("checks creator", () => {
    const { agent } = createAgent();
    expect(agent.wasCreatedBy("user-1")).toBe(true);
    expect(agent.wasCreatedBy("user-other")).toBe(false);
  });

  it("reconstitutes from primitives via create", () => {
    const { agent } = createAgent();
    const primitives = agent.toPrimitives();
    const reconstituted = Agent.create({
      ...primitives,
      type: primitives.type as AgentType,
      status: primitives.status as AgentStatus,
    });
    expect(reconstituted.id).toBe(agent.id);
    expect(reconstituted.toPrimitives()).toEqual(primitives);
  });
});
