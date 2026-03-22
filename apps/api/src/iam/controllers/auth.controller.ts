import { Body, Controller, Get, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import {
  SignUpRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  UpdateProfileRequestSchema,
  ChangePasswordRequestSchema,
  AuthTokensResponseSchema,
  ProfileResponseSchema,
} from "@repo/contracts/iam";
import {
  SignUp,
  Login,
  ForgotPassword,
  ResetPassword,
  GetProfile,
  UpdateProfile,
  ChangePassword,
  type AuthService,
  type UserRepository,
} from "@repo/contexts/iam";
import type { EventBus, Logger } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

function formatProfile(profile: ReturnType<import("@repo/contexts/iam").User["toPrimitives"]>) {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

@Controller("auth")
export class AuthController {
  private readonly signUp: SignUp;
  private readonly login: Login;
  private readonly forgotPassword: ForgotPassword;
  private readonly resetPassword: ResetPassword;
  private readonly getProfile: GetProfile;
  private readonly updateProfile: UpdateProfile;
  private readonly changePassword: ChangePassword;

  constructor(
    @Inject("AuthService") authService: AuthService,
    @Inject("UserRepository") userRepo: UserRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("Logger") logger: Logger,
  ) {
    this.signUp = new SignUp(authService, eventBus, logger);
    this.login = new Login(authService, logger);
    this.forgotPassword = new ForgotPassword(authService);
    this.resetPassword = new ResetPassword(authService);
    this.getProfile = new GetProfile(userRepo);
    this.updateProfile = new UpdateProfile(userRepo);
    this.changePassword = new ChangePassword(authService);
  }

  @Post("signup")
  async handleSignUp(@Body() body: unknown) {
    const data = SignUpRequestSchema.parse(body);
    await this.signUp.execute({
      email: data.email,
      password: data.password,
      fullName: data.fullName ?? null,
    });
    return { email: data.email, fullName: data.fullName ?? null };
  }

  @Post("login")
  async handleLogin(@Body() body: unknown) {
    const data = LoginRequestSchema.parse(body);
    const tokens = await this.login.execute({
      email: data.email,
      password: data.password,
    });
    return AuthTokensResponseSchema.parse(tokens);
  }

  @Post("forgot-password")
  async handleForgotPassword(@Body() body: unknown) {
    const data = ForgotPasswordRequestSchema.parse(body);
    await this.forgotPassword.execute(data.email);
    return { message: "If the email exists, a reset link has been sent" };
  }

  @Post("reset-password")
  async handleResetPassword(@Body() body: unknown) {
    const data = ResetPasswordRequestSchema.parse(body);
    await this.resetPassword.execute(data.token, data.password);
    return { message: "Password has been reset" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async handleGetProfile(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.getProfile.execute(user.id);
    return ProfileResponseSchema.parse(formatProfile(profile.toPrimitives()));
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async handleUpdateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = UpdateProfileRequestSchema.parse(body);
    const updated = await this.updateProfile.execute({
      userId: user.id,
      fullName: data.fullName ?? null,
      avatarUrl: data.avatarUrl ?? null,
    });
    return ProfileResponseSchema.parse(formatProfile(updated.toPrimitives()));
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  async handleChangePassword(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = ChangePasswordRequestSchema.parse(body);
    await this.changePassword.execute({
      userId: user.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return { message: "Password changed successfully" };
  }
}
