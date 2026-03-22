import type { SupabaseClient } from "@supabase/supabase-js";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";

export class SupabaseRunRepository implements RunRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Run | null> {
    const { data, error } = await this.client
      .from("runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByAgentIdAndExternalRunId(
    agentId: string,
    externalRunId: string,
  ): Promise<Run | null> {
    const { data, error } = await this.client
      .from("runs")
      .select("*")
      .eq("agent_id", agentId)
      .eq("external_run_id", externalRunId)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByAgentId(
    agentId: string,
    options?: { limit: number; offset: number },
  ): Promise<Run[]> {
    let query = this.client
      .from("runs")
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
      .from("runs")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId);

    if (error) return 0;
    return count ?? 0;
  }

  async findByAgentIds(agentIds: string[]): Promise<Run[]> {
    if (agentIds.length === 0) return [];

    const { data, error } = await this.client
      .from("runs")
      .select("*")
      .in("agent_id", agentIds);

    if (error || !data) return [];
    return data.map((row: Record<string, unknown>) => this.toDomain(row));
  }

  async save(run: Run): Promise<void> {
    const p = run.toPrimitives();

    const { error } = await this.client.from("runs").upsert({
      id: p.id,
      agent_id: p.agentId,
      external_run_id: p.externalRunId,
      status: p.status,
      started_at: p.startedAt.toISOString(),
      completed_at: p.completedAt?.toISOString() ?? null,
      duration_ms: p.durationMs,
      tokens_used: p.tokensUsed,
      cost: p.cost,
      metadata: p.metadata,
      error: p.error,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private toDomain(row: Record<string, unknown>): Run {
    return Run.create({
      id: row.id as string,
      agentId: row.agent_id as string,
      externalRunId: (row.external_run_id as string) ?? null,
      status: row.status as RunStatus,
      startedAt: new Date(row.started_at as string),
      completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
      durationMs: (row.duration_ms as number) ?? null,
      tokensUsed: (row.tokens_used as number) ?? null,
      cost: row.cost !== null && row.cost !== undefined ? Number(row.cost) : null,
      metadata: (row.metadata as Record<string, unknown>) ?? null,
      error: (row.error as string) ?? null,
      createdAt: new Date(row.created_at as string),
    });
  }
}
