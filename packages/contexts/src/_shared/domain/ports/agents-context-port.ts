/**
 * Port for cross-context communication with the Agents context.
 * Allows other contexts (like monitoring) to resolve agent info
 * without importing agent domain objects directly.
 */
export interface AgentsContextPort {
  getAgentNamesByIds(agentIds: string[]): Promise<Record<string, string>>;
  getAgentIdsForOrganization(organizationId: string): Promise<string[]>;
}
