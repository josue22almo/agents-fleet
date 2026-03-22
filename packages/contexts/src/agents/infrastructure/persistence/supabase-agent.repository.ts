import type { SupabaseClient } from "@supabase/supabase-js";
import { Agent } from "../../domain/entities/agent";
import { AgentStatus } from "../../domain/value-objects/agent-status";
import { AgentType } from "../../domain/value-objects/agent-type";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

export class SupabaseAgentRepository implements AgentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Agent | null> {
    const { data, error } = await this.client
      .from("agents")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByOrganizationId(orgId: string): Promise<Agent[]> {
    const { data, error } = await this.client
      .from("agents")
      .select("*")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.toDomain(row));
  }

  async findByTokenHash(tokenHash: string): Promise<Agent | null> {
    const { data, error } = await this.client
      .from("agents")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async save(agent: Agent): Promise<void> {
    const primitives = agent.toPrimitives();

    const { error } = await this.client.from("agents").upsert({
      id: primitives.id,
      organization_id: primitives.organizationId,
      name: primitives.name,
      type: primitives.type,
      token_hash: primitives.tokenHash,
      token_prefix: primitives.tokenPrefix,
      status: primitives.status,
      last_seen_at: primitives.lastSeenAt?.toISOString() ?? null,
      created_by: primitives.createdBy,
      created_at: primitives.createdAt.toISOString(),
      updated_at: primitives.updatedAt.toISOString(),
      deleted_at: primitives.deletedAt?.toISOString() ?? null,
    });

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("agents")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): Agent {
    return Agent.create({
      id: row.id as string,
      organizationId: row.organization_id as string,
      name: row.name as string,
      type: row.type as AgentType,
      tokenHash: row.token_hash as string,
      tokenPrefix: row.token_prefix as string,
      status: row.status as AgentStatus,
      lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at as string) : null,
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    });
  }
}
