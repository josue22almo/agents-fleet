import type { SupabaseClient } from "@supabase/supabase-js";
import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import type { UserRepository } from "../../ports/repositories/user-repository.js";

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("email", email.value)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async save(user: User): Promise<void> {
    const primitives = user.toPrimitives();
    const { error } = await this.client.from("profiles").upsert({
      id: primitives.id,
      email: primitives.email,
      full_name: primitives.fullName,
      avatar_url: primitives.avatarUrl,
      updated_at: primitives.updatedAt.toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  private toDomain(row: Record<string, unknown>): User {
    return User.create({
      id: row.id as string,
      email: new Email(row.email as string),
      fullName: (row.full_name as string) ?? null,
      avatarUrl: (row.avatar_url as string) ?? null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }
}
