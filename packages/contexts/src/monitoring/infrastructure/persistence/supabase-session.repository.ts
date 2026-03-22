import type { SupabaseClient } from "@supabase/supabase-js";
import { Session } from "../../domain/entities/session";
import { SessionStatus } from "../../domain/value-objects/session-status";
import type { SessionRepository } from "../../ports/repositories/session-repository";

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Session | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByAgentId(
    agentId: string,
    options?: { limit: number; offset: number },
  ): Promise<Session[]> {
    let query = this.client
      .from("sessions")
      .select("*")
      .eq("agent_id", agentId)
      .order("started_at", { ascending: false });

    if (options) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row: Record<string, unknown>) => this.toDomain(row));
  }

  async countByAgentId(agentId: string): Promise<number> {
    const { count, error } = await this.client
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId);

    if (error) return 0;
    return count ?? 0;
  }

  async save(session: Session): Promise<void> {
    const p = session.toPrimitives();

    const { error } = await this.client.from("sessions").upsert({
      id: p.id,
      agent_id: p.agentId,
      name: p.name,
      status: p.status,
      started_at: p.startedAt.toISOString(),
      completed_at: p.completedAt?.toISOString() ?? null,
      total_duration_ms: p.totalDurationMs,
      total_tokens_used: p.totalTokensUsed,
      total_cost: p.totalCost,
      run_count: p.runCount,
      metadata: p.metadata,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private toDomain(row: Record<string, unknown>): Session {
    return Session.create({
      id: row.id as string,
      agentId: row.agent_id as string,
      name: (row.name as string) ?? null,
      status: row.status as SessionStatus,
      startedAt: new Date(row.started_at as string),
      completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
      totalDurationMs: (row.total_duration_ms as number) ?? null,
      totalTokensUsed: (row.total_tokens_used as number) ?? null,
      totalCost: row.total_cost !== null && row.total_cost !== undefined ? Number(row.total_cost) : null,
      runCount: (row.run_count as number) ?? 0,
      metadata: (row.metadata as Record<string, unknown>) ?? null,
      createdAt: new Date(row.created_at as string),
    });
  }
}
