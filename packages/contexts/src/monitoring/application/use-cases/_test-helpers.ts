import { InMemoryRunRepository } from "../../infrastructure/persistence/in-memory-run-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

export function createTestDeps() {
  let idCounter = 0;

  const runRepo = new InMemoryRunRepository();

  const idGenerator: IdGenerator = {
    generate: () => `id-${++idCounter}`,
  };

  return {
    runRepo,
    idGenerator,
  };
}
