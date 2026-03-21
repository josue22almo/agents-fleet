import { Body, Controller, Get, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import {
  SignUpRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  UpdateProfileRequestSchema,
} from "@repo/contracts/iam";
import {
  SignUp,
  Login,
  ForgotPassword,
  ResetPassword,
  GetProfile,
  UpdateProfile,
  type AuthService,
  type UserRepository,
} from "@repo/contexts/iam";
import type { EventBus } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  private readonly signUp: SignUp;
  private readonly login: Login;
  private readonly forgotPassword: ForgotPassword;
  private readonly resetPassword: ResetPassword;
  private readonly getProfile: GetProfile;
  private readonly updateProfile: UpdateProfile;

  constructor(
    @Inject("AuthService") authService: AuthService,
    @Inject("UserRepository") userRepo: UserRepository,
    @Inject("EventBus") eventBus: EventBus,
  ) {
    this.signUp = new SignUp(authService, eventBus);
    this.login = new Login(authService);
    this.forgotPassword = new ForgotPassword(authService);
    this.resetPassword = new ResetPassword(authService);
    this.getProfile = new GetProfile(userRepo);
    this.updateProfile = new UpdateProfile(userRepo);
  }

  @Post("signup")
  async handleSignUp(@Body() body: unknown) {
    const data = SignUpRequestSchema.parse(body);
    return this.signUp.execute({
      email: data.email,
      password: data.password,
      fullName: data.fullName ?? null,
    });
  }

  @Post("login")
  async handleLogin(@Body() body: unknown) {
    const data = LoginRequestSchema.parse(body);
    return this.login.execute({
      email: data.email,
      password: data.password,
    });
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
    return profile.toPrimitives();
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
    return updated.toPrimitives();
  }
}
