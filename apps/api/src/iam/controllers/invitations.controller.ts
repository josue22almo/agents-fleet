import { Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import {
  AcceptInvitation,
  DeclineInvitation,
  type InvitationRepository,
  type OrganizationRepository,
} from "@repo/contexts/iam";
import type { IdGenerator, EventBus } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller("invites")
export class InvitationsController {
  private readonly acceptInvitation: AcceptInvitation;
  private readonly declineInvitation: DeclineInvitation;

  constructor(
    @Inject("InvitationRepository") invitationRepo: InvitationRepository,
    @Inject("OrganizationRepository") orgRepo: OrganizationRepository,
    @Inject("IdGenerator") idGenerator: IdGenerator,
    @Inject("EventBus") eventBus: EventBus,
  ) {
    this.acceptInvitation = new AcceptInvitation(invitationRepo, orgRepo, idGenerator, eventBus);
    this.declineInvitation = new DeclineInvitation(invitationRepo);
  }

  @Get(":token")
  async handleGetDetails(@Param("token") token: string) {
    return { token, message: "Use POST to accept or decline" };
  }

  @Post(":token/accept")
  @UseGuards(JwtAuthGuard)
  async handleAccept(@CurrentUser() user: AuthenticatedUser, @Param("token") token: string) {
    await this.acceptInvitation.execute({ token, userId: user.id });
    return { message: "Invitation accepted" };
  }

  @Post(":token/decline")
  @UseGuards(JwtAuthGuard)
  async handleDecline(@Param("token") token: string) {
    await this.declineInvitation.execute(token);
    return { message: "Invitation declined" };
  }
}
