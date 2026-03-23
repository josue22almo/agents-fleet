import type { ToolCall } from "../../domain/entities/tool-call";

export interface ToolCallRepository {
  findByAgentId(agentId: string): Promise<ToolCall[]>;
  findByRunId(runId: string): Promise<ToolCall[]>;
  save(toolCall: ToolCall): Promise<void>;
}
