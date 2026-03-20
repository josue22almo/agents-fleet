import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { VerifyToken, type AuthService } from "@repo/contexts/iam";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly verifyToken: VerifyToken;

  constructor(@Inject("AuthService") authService: AuthService) {
    this.verifyToken = new VerifyToken(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("Missing authorization token");
    }

    try {
      const user = await this.verifyToken.execute(token);
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
