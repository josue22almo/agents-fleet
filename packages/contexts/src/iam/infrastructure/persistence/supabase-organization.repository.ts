import type { SupabaseClient } from "@supabase/supabase-js";
import { Organization } from "../../domain/entities/organization.js";
import { OrganizationMember } from "../../domain/entities/organization-member.js";
import { OrganizationSummary } from "../../domain/read-models/organization-summary.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import { Slug } from "../../domain/value-objects/slug.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("*, organization_members(*)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findBySlug(slug: Slug): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("*, organization_members(*)")
      .eq("slug", slug.value)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async slugExists(slug: Slug): Promise<boolean> {
    const { count, error } = await this.client
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug.value);

    if (error) return false;
    return (count ?? 0) > 0;
  }

  async findByUserId(userId: string): Promise<OrganizationSummary[]> {
    const { data, error } = await this.client
      .from("organization_members")
      .select(`
        role,
        organizations (
          id,
          name,
          slug,
          type,
          organization_members (id)
        )
      `)
      .eq("user_id", userId);

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => {
      const org = row.organizations as Record<string, unknown>;
      const members = org.organization_members as unknown[];
      return OrganizationSummary.create({
        id: org.id as string,
        name: org.name as string,
        slug: org.slug as string,
        type: org.type as OrgType,
        memberCount: members.length,
        currentUserRole: row.role as MemberRole,
      });
    });
  }

  async save(organization: Organization): Promise<void> {
    const primitives = organization.toPrimitives();

    const { error: orgError } = await this.client
      .from("organizations")
      .upsert({
        id: primitives.id,
        name: primitives.name,
        slug: primitives.slug,
        type: primitives.type,
        updated_at: primitives.updatedAt.toISOString(),
      });
    if (orgError) throw new Error(orgError.message);

    for (const member of primitives.members) {
      const { error: memberError } = await this.client
        .from("organization_members")
        .upsert({
          id: member.id,
          organization_id: member.organizationId,
          user_id: member.userId,
          role: member.role,
        });
      if (memberError) throw new Error(memberError.message);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from("organizations")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): Organization {
    const members = (row.organization_members as Record<string, unknown>[]) ?? [];
    return Organization.create({
      id: row.id as string,
      name: row.name as string,
      slug: new Slug(row.slug as string),
      type: row.type as OrgType,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      members: members.map(
        (m) =>
          OrganizationMember.create({
            id: m.id as string,
            organizationId: m.organization_id as string,
            userId: m.user_id as string,
            role: m.role as MemberRole,
            createdAt: new Date(m.created_at as string),
          }),
      ),
    });
  }
}
