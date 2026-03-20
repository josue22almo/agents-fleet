import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CreateOrgRequestSchema, UpdateOrgRequestSchema } from "@repo/contracts/iam";
import {
  CreateOrganization,
  UpdateOrganization,
  DeleteOrganization,
  ListOrganizations,
  type OrganizationRepository,
} from "@repo/contexts/iam";
import type { IdGenerator, EventBus } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  private readonly createOrganization: CreateOrganization;
  private readonly updateOrganization: UpdateOrganization;
  private readonly deleteOrganization: DeleteOrganization;
  private readonly listOrganizations: ListOrganizations;

  constructor(
    @Inject("OrganizationRepository") orgRepo: OrganizationRepository,
    @Inject("IdGenerator") idGenerator: IdGenerator,
    @Inject("EventBus") eventBus: EventBus,
  ) {
    this.createOrganization = new CreateOrganization(orgRepo, idGenerator, eventBus);
    this.updateOrganization = new UpdateOrganization(orgRepo);
    this.deleteOrganization = new DeleteOrganization(orgRepo);
    this.listOrganizations = new ListOrganizations(orgRepo);
  }

  @Get()
  async handleList(@CurrentUser() user: AuthenticatedUser) {
    const orgs = await this.listOrganizations.execute(user.id);
    return orgs.map((org) => org.toPrimitives());
  }

  @Post()
  async handleCreate(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = CreateOrgRequestSchema.parse(body);
    const org = await this.createOrganization.execute({
      name: data.name,
      slug: data.slug,
      createdBy: user.id,
    });
    return org.toPrimitives();
  }

  @Patch(":id")
  async handleUpdate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: unknown) {
    const data = UpdateOrgRequestSchema.parse(body);
    const org = await this.updateOrganization.execute({
      organizationId: id,
      name: data.name,
      slug: data.slug,
      updatedBy: user.id,
    });
    return org.toPrimitives();
  }

  @Delete(":id")
  async handleDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.deleteOrganization.execute({
      organizationId: id,
      deletedBy: user.id,
    });
    return { message: "Organization deleted" };
  }
}
