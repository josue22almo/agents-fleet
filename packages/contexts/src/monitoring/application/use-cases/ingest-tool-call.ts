import { ToolCall } from "../../domain/entities/tool-call";
import type { ToolCallRepository } from "../../ports/repositories/tool-call-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

interface IngestToolCallParams {
  agentId: string;
  runId: string;
  toolName: string;
  durationMs?: number;
  success?: boolean;
}

export class IngestToolCall {
  constructor(
    private readonly toolCallRepo: ToolCallRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(params: IngestToolCallParams): Promise<ToolCall> {
    const toolCall = ToolCall.record({
      id: this.idGenerator.generate(),
      runId: params.runId,
      agentId: params.agentId,
      toolName: params.toolName,
      durationMs: params.durationMs,
      success: params.success,
    });

    await this.toolCallRepo.save(toolCall);
    return toolCall;
  }
}
