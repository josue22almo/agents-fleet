import { describe, it, expect } from "vitest";
import { Slug } from "./slug.js";

describe("Slug", () => {
  it("creates a valid slug", () => {
    const slug = new Slug("my-org");
    expect(slug.value).toBe("my-org");
  });

  it("rejects an empty slug", () => {
    expect(() => new Slug("")).toThrow("cannot be empty");
  });

  it("rejects uppercase characters", () => {
    expect(() => new Slug("MyOrg")).toThrow("Invalid slug");
  });

  it("rejects spaces", () => {
    expect(() => new Slug("my org")).toThrow("Invalid slug");
  });

  it("rejects slugs exceeding 50 characters", () => {
    const long = "a".repeat(51);
    expect(() => new Slug(long)).toThrow("cannot exceed 50");
  });

  it("rejects leading hyphens", () => {
    expect(() => new Slug("-my-org")).toThrow("Invalid slug");
  });

  it("rejects trailing hyphens", () => {
    expect(() => new Slug("my-org-")).toThrow("Invalid slug");
  });

  it("accepts numbers", () => {
    const slug = new Slug("org-123");
    expect(slug.value).toBe("org-123");
  });

  describe("fromName", () => {
    it("converts a name to a slug", () => {
      const slug = Slug.fromName("My Organization");
      expect(slug.value).toBe("my-organization");
    });

    it("strips special characters", () => {
      const slug = Slug.fromName("Josue's Team!");
      expect(slug.value).toBe("josue-s-team");
    });

    it("trims whitespace", () => {
      const slug = Slug.fromName("  spaced  ");
      expect(slug.value).toBe("spaced");
    });
  });
});
