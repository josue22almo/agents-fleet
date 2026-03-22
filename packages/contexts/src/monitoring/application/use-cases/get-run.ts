import type { Run } from "../../domain/entities/run";
import { RunNotFoundError } from "../../domain/errors/run-not-found.error";
import type { RunRepository } from "../../ports/repositories/run-repository";

export class GetRun {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(runId: string): Promise<Run> {
    const run = await this.runRepo.findById(runId);
    if (!run) {
      throw new RunNotFoundError(runId);
    }
    return run;
  }
}
