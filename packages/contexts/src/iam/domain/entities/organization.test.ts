import { describe, it, expect } from "vitest";
import { AlreadyMemberError } from "../errors/already-member.error.js";
import { InsufficientPermissionsError } from "../errors/insufficient-permissions.error.js";
import { MemberRole } from "../value-objects/member-role.js";
import { OrgType } from "../value-objects/org-type.js";
import { Slug } from "../value-objects/slug.js";
import { OrganizationMember } from "./organization-member.js";
import { Organization } from "./organization.js";

function createOrg(members: OrganizationMember[] = []): Organization {
  return Organization.create({
    id: "org-1",
    name: "Test Org",
    slug: new Slug("test-org"),
    type: OrgType.TEAM,
    createdAt: new Date(),
    updatedAt: new Date(),
    members,
  });
}

function createMember(
  userId: string,
  role: MemberRole,
  id?: string,
): OrganizationMember {
  return OrganizationMember.create({
    id: id ?? `member-${userId}`,
    organizationId: "org-1",
    userId,
    role,
    createdAt: new Date(),
  });
}

describe("Organization", () => {
  describe("createPersonal", () => {
    it("creates a personal org with owner member", () => {
      const org = Organization.createPersonal("org-1", "Josue", "user-1", "member-1");
      expect(org.isPersonal).toBe(true);
      expect(org.isTeam).toBe(false);
      const primitives = org.toPrimitives();
      expect(primitives.name).toBe("Josue's Space");
      expect(org.memberCount).toBe(1);
      expect(org.isMemberOwner("user-1")).toBe(true);
    });
  });

  describe("updateDetails", () => {
    it("allows owner to update", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      org.updateDetails("New Name", new Slug("new-slug"), "user-1");
      const primitives = org.toPrimitives();
      expect(primitives.name).toBe("New Name");
      expect(primitives.slug).toBe("new-slug");
    });

    it("allows admin to update", () => {
      const org = createOrg([createMember("user-1", MemberRole.ADMIN)]);
      org.updateDetails("New Name", new Slug("new-slug"), "user-1");
      expect(org.toPrimitives().name).toBe("New Name");
    });

    it("rejects member update", () => {
      const org = createOrg([createMember("user-1", MemberRole.MEMBER)]);
      expect(() =>
        org.updateDetails("New Name", new Slug("new-slug"), "user-1"),
      ).toThrow(InsufficientPermissionsError);
    });

    it("rejects non-member update", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      expect(() =>
        org.updateDetails("New Name", new Slug("new-slug"), "user-999"),
      ).toThrow(InsufficientPermissionsError);
    });
  });

  describe("addMember", () => {
    it("adds a new member", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      const member = org.addMember("member-2", "user-2", MemberRole.MEMBER);
      expect(member.isMember).toBe(true);
      expect(member.belongsTo("user-2")).toBe(true);
      expect(org.memberCount).toBe(2);
    });

    it("throws when user is already a member", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      expect(() =>
        org.addMember("member-dup", "user-1", MemberRole.MEMBER),
      ).toThrow(AlreadyMemberError);
    });
  });

  describe("removeMember", () => {
    it("allows owner to remove a member", () => {
      const org = createOrg([
        createMember("user-1", MemberRole.OWNER),
        createMember("user-2", MemberRole.MEMBER),
      ]);
      org.removeMember("user-2", "user-1");
      expect(org.memberCount).toBe(1);
    });

    it("rejects non-owner removal", () => {
      const org = createOrg([
        createMember("user-1", MemberRole.OWNER),
        createMember("user-2", MemberRole.ADMIN),
        createMember("user-3", MemberRole.MEMBER),
      ]);
      expect(() => org.removeMember("user-3", "user-2")).toThrow(
        InsufficientPermissionsError,
      );
    });
  });

  describe("changeMemberRole", () => {
    it("allows owner to change role", () => {
      const org = createOrg([
        createMember("user-1", MemberRole.OWNER),
        createMember("user-2", MemberRole.MEMBER),
      ]);
      org.changeMemberRole("user-2", MemberRole.ADMIN, "user-1");
      expect(org.isMemberAdmin("user-2")).toBe(true);
    });

    it("allows admin to change role", () => {
      const org = createOrg([
        createMember("user-1", MemberRole.ADMIN),
        createMember("user-2", MemberRole.MEMBER),
      ]);
      org.changeMemberRole("user-2", MemberRole.ADMIN, "user-1");
      expect(org.isMemberAdmin("user-2")).toBe(true);
    });

    it("rejects member changing role", () => {
      const org = createOrg([
        createMember("user-1", MemberRole.MEMBER),
        createMember("user-2", MemberRole.MEMBER),
      ]);
      expect(() =>
        org.changeMemberRole("user-2", MemberRole.ADMIN, "user-1"),
      ).toThrow(InsufficientPermissionsError);
    });
  });

  describe("hasMember", () => {
    it("returns true for existing member", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      expect(org.hasMember("user-1")).toBe(true);
    });

    it("returns false for non-member", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      expect(org.hasMember("user-999")).toBe(false);
    });
  });

  describe("toPrimitives", () => {
    it("returns all data including members", () => {
      const org = createOrg([createMember("user-1", MemberRole.OWNER)]);
      const primitives = org.toPrimitives();
      expect(primitives.id).toBe("org-1");
      expect(primitives.name).toBe("Test Org");
      expect(primitives.slug).toBe("test-org");
      expect(primitives.type).toBe("team");
      expect(primitives.members).toHaveLength(1);
      expect(primitives.members[0]!.userId).toBe("user-1");
    });
  });
});
