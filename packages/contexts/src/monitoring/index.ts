// Entities
export { Run } from "./domain/entities/run";
export type { RunPrimitives } from "./domain/entities/run";

// Value Objects
export { RunStatus } from "./domain/value-objects/run-status";

// Errors
export { RunNotFoundError } from "./domain/errors/run-not-found.error";

// Events
export { RunCompletedEvent } from "./domain/events/run-completed.event";
export { RunFailedEvent } from "./domain/events/run-failed.event";
export { RunIngestedEvent } from "./domain/events/run-ingested.event";

// Read Models
export { AgentMetrics } from "./domain/read-models/agent-metrics";

// Ports
export type { RunRepository } from "./ports/repositories/run-repository";

// Use Cases
export { IngestEvent } from "./application/use-cases/ingest-event";
export { ListRuns } from "./application/use-cases/list-runs";
export { GetRun } from "./application/use-cases/get-run";
export { GetAgentMetrics } from "./application/use-cases/get-agent-metrics";
export { GetDashboardMetrics } from "./application/use-cases/get-dashboard-metrics";

// Infrastructure
export { SupabaseRunRepository } from "./infrastructure/persistence/supabase-run.repository";
export { InMemoryRunRepository } from "./infrastructure/persistence/in-memory-run-repository";
