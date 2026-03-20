import type { SupabaseClient } from "@supabase/supabase-js";
import { Invitation, InvitationStatus } from "../../domain/entities/invitation.js";
import { Email } from "../../domain/value-objects/email.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import type { InvitationRepository } from "../../ports/repositories/invitation-repository.js";

export class SupabaseInvitationRepository implements InvitationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByToken(token: string): Promise<Invitation | null> {
    const { data, error } = await this.client
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findPendingByOrgAndEmail(
    organizationId: string,
    email: string,
  ): Promise<Invitation | null> {
    const { data, error } = await this.client
      .from("invitations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async save(invitation: Invitation): Promise<void> {
    const primitives = invitation.toPrimitives();
    const { error } = await this.client.from("invitations").upsert({
      id: primitives.id,
      organization_id: primitives.organizationId,
      email: primitives.email,
      role: primitives.role,
      token: primitives.token,
      invited_by: primitives.invitedBy,
      status: primitives.status,
      expires_at: primitives.expiresAt.toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): Invitation {
    return Invitation.reconstitute({
      id: row.id as string,
      organizationId: row.organization_id as string,
      email: new Email(row.email as string),
      role: row.role as MemberRole,
      token: row.token as string,
      invitedBy: row.invited_by as string,
      status: row.status as InvitationStatus,
      expiresAt: new Date(row.expires_at as string),
      createdAt: new Date(row.created_at as string),
    });
  }
}
