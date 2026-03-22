// Entities
export { User } from "./domain/entities/user";
export { Organization } from "./domain/entities/organization";
export { OrganizationMember } from "./domain/entities/organization-member";
export { Invitation } from "./domain/entities/invitation";

// Value Objects
export { Email } from "./domain/value-objects/email";
export { Slug } from "./domain/value-objects/slug";
export { MemberRole } from "./domain/value-objects/member-role";
export { OrgType } from "./domain/value-objects/org-type";

// Errors
export { UserNotFoundError } from "./domain/errors/user-not-found.error";
export { OrganizationNotFoundError } from "./domain/errors/organization-not-found.error";
export { SlugAlreadyTakenError } from "./domain/errors/slug-already-taken.error";
export { InsufficientPermissionsError } from "./domain/errors/insufficient-permissions.error";
export { AlreadyMemberError } from "./domain/errors/already-member.error";
export { InvalidCredentialsError } from "./domain/errors/invalid-credentials.error";
export { InvalidTokenError } from "./domain/errors/invalid-token.error";
export { InvitationExpiredError } from "./domain/errors/invitation-expired.error";
export { InvitationAlreadyRespondedError } from "./domain/errors/invitation-already-responded.error";

// Events
export { UserSignedUpEvent } from "./domain/events/user-signed-up.event";
export { OrganizationCreatedEvent } from "./domain/events/organization-created.event";
export { MemberInvitedEvent } from "./domain/events/member-invited.event";
export { InvitationAcceptedEvent } from "./domain/events/invitation-accepted.event";

// Read Models
export { OrganizationSummary } from "./domain/read-models/organization-summary";
export { MemberSummary } from "./domain/read-models/member-summary";

// Ports
export type { UserRepository } from "./ports/repositories/user-repository";
export type { OrganizationRepository } from "./ports/repositories/organization-repository";
export type { InvitationRepository } from "./ports/repositories/invitation-repository";
export type { AuthService, AuthTokens, AuthUser } from "./ports/services/auth-service";
export type { TokenGenerator } from "./ports/services/token-generator";

// Event Handlers
export { CreateProfileOnUserSignedUpEventHandler } from "./application/event-handlers/create-profile-on-user-signed-up.event-handler";
export { CreatePersonalOrgOnUserSignedUpEventHandler } from "./application/event-handlers/create-personal-org-on-user-signed-up.event-handler";

// Use Cases
export { SignUp } from "./application/use-cases/sign-up";
export { Login } from "./application/use-cases/login";
export { ForgotPassword } from "./application/use-cases/forgot-password";
export { ResetPassword } from "./application/use-cases/reset-password";
export { VerifyToken } from "./application/use-cases/verify-token";
export { GetProfile } from "./application/use-cases/get-profile";
export { UpdateProfile } from "./application/use-cases/update-profile";
export { CreateOrganization } from "./application/use-cases/create-organization";
export { UpdateOrganization } from "./application/use-cases/update-organization";
export { DeleteOrganization } from "./application/use-cases/delete-organization";
export { ListOrganizations } from "./application/use-cases/list-organizations";
export { GetOrganizationBySlug } from "./application/use-cases/get-organization-by-slug";
export { InviteMember } from "./application/use-cases/invite-member";
export { AcceptInvitation } from "./application/use-cases/accept-invitation";
export { DeclineInvitation } from "./application/use-cases/decline-invitation";
export { ChangeMemberRole } from "./application/use-cases/change-member-role";
export { RemoveMember } from "./application/use-cases/remove-member";
export { ListMembers } from "./application/use-cases/list-members";
export { ChangePassword } from "./application/use-cases/change-password";

// Infrastructure
export { SupabaseAuthService } from "./infrastructure/services/supabase-auth.service";
export { SupabaseUserRepository } from "./infrastructure/persistence/supabase-user.repository";
export { SupabaseOrganizationRepository } from "./infrastructure/persistence/supabase-organization.repository";
export { SupabaseInvitationRepository } from "./infrastructure/persistence/supabase-invitation.repository";
export { InMemoryUserRepository } from "./infrastructure/persistence/in-memory-user-repository";
export { InMemoryOrganizationRepository } from "./infrastructure/persistence/in-memory-organization-repository";
export { InMemoryInvitationRepository } from "./infrastructure/persistence/in-memory-invitation-repository";
