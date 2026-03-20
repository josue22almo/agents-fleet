import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { InviteMemberRequestSchema, ChangeMemberRoleRequestSchema } from "@repo/contracts/iam";
import {
  InviteMember,
  ChangeMemberRole,
  RemoveMember,
  ListMembers,
  MemberRole,
  type OrganizationRepository,
  type InvitationRepository,
  type UserRepository,
  type TokenGenerator,
} from "@repo/contexts/iam";
import type { IdGenerator, EventBus, EmailService } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller("organizations/:orgId/members")
@UseGuards(JwtAuthGuard)
export class MembersController {
  private readonly inviteMember: InviteMember;
  private readonly changeMemberRole: ChangeMemberRole;
  private readonly removeMember: RemoveMember;
  private readonly listMembers: ListMembers;

  constructor(
    @Inject("OrganizationRepository") orgRepo: OrganizationRepository,
    @Inject("InvitationRepository") invitationRepo: InvitationRepository,
    @Inject("UserRepository") userRepo: UserRepository,
    @Inject("EmailService") emailService: EmailService,
    @Inject("IdGenerator") idGenerator: IdGenerator,
    @Inject("TokenGenerator") tokenGenerator: TokenGenerator,
    @Inject("EventBus") eventBus: EventBus,
  ) {
    this.inviteMember = new InviteMember(
      orgRepo,
      invitationRepo,
      userRepo,
      emailService,
      idGenerator,
      tokenGenerator,
      eventBus,
    );
    this.changeMemberRole = new ChangeMemberRole(orgRepo);
    this.removeMember = new RemoveMember(orgRepo);
    this.listMembers = new ListMembers(orgRepo, userRepo);
  }

  @Get()
  async handleList(@CurrentUser() user: AuthenticatedUser, @Param("orgId") orgId: string) {
    const members = await this.listMembers.execute(orgId, user.id);
    return members.map((m) => m.toPrimitives());
  }

  @Post()
  async handleInvite(@CurrentUser() user: AuthenticatedUser, @Param("orgId") orgId: string, @Body() body: unknown) {
    const data = InviteMemberRequestSchema.parse(body);
    const invitation = await this.inviteMember.execute({
      organizationId: orgId,
      email: data.email,
      role: data.role as MemberRole,
      invitedBy: user.id,
    });
    return invitation.toPrimitives();
  }

  @Patch(":memberId")
  async handleChangeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @Body() body: unknown,
  ) {
    const data = ChangeMemberRoleRequestSchema.parse(body);
    await this.changeMemberRole.execute({
      organizationId: orgId,
      targetUserId: memberId,
      newRole: data.role as MemberRole,
      changedBy: user.id,
    });
    return { message: "Role updated" };
  }

  @Delete(":memberId")
  async handleRemove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
  ) {
    await this.removeMember.execute({
      organizationId: orgId,
      targetUserId: memberId,
      removedBy: user.id,
    });
    return { message: "Member removed" };
  }
}
