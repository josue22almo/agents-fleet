import type { SupabaseClient } from "@supabase/supabase-js";
import { ToolCall } from "../../domain/entities/tool-call";
import type { ToolCallRepository } from "../../ports/repositories/tool-call-repository";

export class SupabaseToolCallRepository implements ToolCallRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByAgentId(agentId: string): Promise<ToolCall[]> {
    const { data, error } = await this.client
      .from("tool_calls")
      .select("*")
      .eq("agent_id", agentId)
      .order("timestamp", { ascending: false });

    if (error || !data) return [];
    return data.map((row: Record<string, unknown>) => this.toDomain(row));
  }

  async findByRunId(runId: string): Promise<ToolCall[]> {
    const { data, error } = await this.client
      .from("tool_calls")
      .select("*")
      .eq("run_id", runId)
      .order("timestamp", { ascending: true });

    if (error || !data) return [];
    return data.map((row: Record<string, unknown>) => this.toDomain(row));
  }

  async save(toolCall: ToolCall): Promise<void> {
    const p = toolCall.toPrimitives();

    const { error } = await this.client.from("tool_calls").upsert({
      id: p.id,
      run_id: p.runId,
      agent_id: p.agentId,
      tool_name: p.toolName,
      duration_ms: p.durationMs,
      success: p.success,
      timestamp: p.timestamp.toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private toDomain(row: Record<string, unknown>): ToolCall {
    return ToolCall.create({
      id: row.id as string,
      runId: row.run_id as string,
      agentId: row.agent_id as string,
      toolName: row.tool_name as string,
      durationMs: (row.duration_ms as number) ?? null,
      success: row.success as boolean,
      timestamp: new Date(row.timestamp as string),
      createdAt: new Date(row.created_at as string),
    });
  }
}
