import { ValueObject } from "../../../_shared/domain/models/value-object.js";

export class Slug extends ValueObject<string> {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private static readonly MAX_LENGTH = 50;

  protected validate(value: string): void {
    if (value.length === 0) {
      throw new Error("Slug cannot be empty");
    }
    if (value.length > Slug.MAX_LENGTH) {
      throw new Error(`Slug cannot exceed ${Slug.MAX_LENGTH} characters`);
    }
    if (!Slug.SLUG_REGEX.test(value)) {
      throw new Error(
        `Invalid slug: "${value}". Must be lowercase alphanumeric with hyphens`,
      );
    }
  }

  static fromName(name: string): Slug {
    const slugValue = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return new Slug(slugValue);
  }
}
