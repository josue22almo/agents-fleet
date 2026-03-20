import type { User } from "../../domain/entities/user.js";
import type { Email } from "../../domain/value-objects/email.js";
import type { UserRepository } from "../../ports/repositories/user-repository.js";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.hasEmail(email)) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
}
