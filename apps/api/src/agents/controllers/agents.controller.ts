import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CreateAgentRequestSchema, UpdateAgentRequestSchema } from "@repo/contracts/agents";
import {
  CreateAgent,
  ListAgents,
  GetAgent,
  UpdateAgent,
  DeleteAgent,
  RegenerateToken,
  type AgentRepository,
} from "@repo/contexts/agents";
import type { IdGenerator, EventBus, IAMContextPort } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

function formatAgentResponse(agent: ReturnType<import("@repo/contexts/agents").Agent["toPrimitives"]>) {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    tokenPrefix: agent.tokenPrefix,
    lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
    createdAt: agent.createdAt.toISOString(),
  };
}

function formatAgentListItem(agent: ReturnType<import("@repo/contexts/agents").Agent["toPrimitives"]>) {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
  };
}

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentsController {
  private readonly createAgent: CreateAgent;
  private readonly listAgents: ListAgents;
  private readonly getAgent: GetAgent;
  private readonly updateAgent: UpdateAgent;
  private readonly deleteAgent: DeleteAgent;
  private readonly regenerateToken: RegenerateToken;

  constructor(
    @Inject("AgentRepository") agentRepo: AgentRepository,
    @Inject("IAMContextPort") iam: IAMContextPort,
    @Inject("IdGenerator") idGenerator: IdGenerator,
    @Inject("EventBus") eventBus: EventBus,
  ) {
    this.createAgent = new CreateAgent(agentRepo, iam, idGenerator, eventBus);
    this.listAgents = new ListAgents(agentRepo);
    this.getAgent = new GetAgent(agentRepo);
    this.updateAgent = new UpdateAgent(agentRepo, iam);
    this.deleteAgent = new DeleteAgent(agentRepo, iam);
    this.regenerateToken = new RegenerateToken(agentRepo, iam);
  }

  @Get()
  async handleList(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    const agents = await this.listAgents.execute(organizationId);
    return agents.map((a) => formatAgentListItem(a.toPrimitives()));
  }

  @Post()
  async handleCreate(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = CreateAgentRequestSchema.parse(body);
    const result = await this.createAgent.execute({
      name: data.name,
      type: data.type as import("@repo/contexts/agents").AgentType,
      organizationId: data.organizationId,
      userId: user.id,
    });
    const primitives = result.agent.toPrimitives();
    return {
      ...formatAgentResponse(primitives),
      connectionToken: result.token.value,
    };
  }

  @Get(":id")
  async handleGet(@Param("id") id: string) {
    const agent = await this.getAgent.execute({ agentId: id });
    return formatAgentResponse(agent.toPrimitives());
  }

  @Patch(":id")
  async handleUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = UpdateAgentRequestSchema.parse(body);
    const agent = await this.updateAgent.execute({
      agentId: id,
      name: data.name,
      userId: user.id,
    });
    return formatAgentResponse(agent.toPrimitives());
  }

  @Delete(":id")
  async handleDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    await this.deleteAgent.execute({
      agentId: id,
      userId: user.id,
    });
    return { message: "Agent deleted" };
  }

  @Post(":id/regenerate-token")
  async handleRegenerateToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    const result = await this.regenerateToken.execute({
      agentId: id,
      userId: user.id,
    });
    const primitives = result.agent.toPrimitives();
    return {
      ...formatAgentResponse(primitives),
      connectionToken: result.token.value,
    };
  }
}
