import type { ToolCall } from "../../domain/entities/tool-call";
import type { ToolCallRepository } from "../../ports/repositories/tool-call-repository";

export class InMemoryToolCallRepository implements ToolCallRepository {
  private toolCalls: Map<string, ToolCall> = new Map();

  async findByAgentId(agentId: string): Promise<ToolCall[]> {
    return Array.from(this.toolCalls.values())
      .filter((tc) => tc.toPrimitives().agentId === agentId)
      .sort(
        (a, b) =>
          b.toPrimitives().timestamp.getTime() -
          a.toPrimitives().timestamp.getTime(),
      );
  }

  async findByRunId(runId: string): Promise<ToolCall[]> {
    return Array.from(this.toolCalls.values())
      .filter((tc) => tc.toPrimitives().runId === runId)
      .sort(
        (a, b) =>
          a.toPrimitives().timestamp.getTime() -
          b.toPrimitives().timestamp.getTime(),
      );
  }

  async save(toolCall: ToolCall): Promise<void> {
    this.toolCalls.set(toolCall.id, toolCall);
  }
}
