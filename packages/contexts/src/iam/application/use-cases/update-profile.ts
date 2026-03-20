import type { User } from "../../domain/entities/user.js";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error.js";
import type { UserRepository } from "../../ports/repositories/user-repository.js";

interface UpdateProfileParams {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export class UpdateProfile {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(params: UpdateProfileParams): Promise<User> {
    const user = await this.userRepo.findById(params.userId);
    if (!user) throw new UserNotFoundError(params.userId);

    user.updateProfile(params.fullName, params.avatarUrl);
    await this.userRepo.save(user);

    return user;
  }
}
