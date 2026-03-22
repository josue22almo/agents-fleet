import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ValidateConnectionToken, type AgentRepository } from "@repo/contexts/agents";

@Injectable()
export class ConnectionTokenGuard implements CanActivate {
  private readonly validateConnectionToken: ValidateConnectionToken;

  constructor(@Inject("AgentRepository") agentRepo: AgentRepository) {
    this.validateConnectionToken = new ValidateConnectionToken(agentRepo);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("Missing connection token");
    }

    try {
      const result = await this.validateConnectionToken.execute(token);
      request.agent = {
        agentId: result.agentId,
        organizationId: result.organizationId,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired connection token");
    }
  }
}
