import { ToolCall } from "../../domain/entities/tool-call";
import type { ToolCallRepository } from "../../ports/repositories/tool-call-repository";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

interface IngestToolCallParams {
  agentId: string;
  externalRunId: string;
  toolName: string;
  durationMs?: number;
  success?: boolean;
}

export class IngestToolCall {
  constructor(
    private readonly toolCallRepo: ToolCallRepository,
    private readonly runRepo: RunRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(params: IngestToolCallParams): Promise<ToolCall> {
    // Resolve external runId to internal UUID
    const run = await this.runRepo.findByAgentIdAndExternalRunId(
      params.agentId,
      params.externalRunId,
    );

    const toolCall = ToolCall.record({
      id: this.idGenerator.generate(),
      runId: run ? run.toPrimitives().id : null,
      agentId: params.agentId,
      toolName: params.toolName,
      durationMs: params.durationMs,
      success: params.success,
    });

    await this.toolCallRepo.save(toolCall);
    return toolCall;
  }
}
