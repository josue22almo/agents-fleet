import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "./forgot-password-form";

const { mockForgotPassword } = vi.hoisted(() => ({
  mockForgotPassword: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({
  api: { auth: { forgotPassword: mockForgotPassword } },
  ApiError: class extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ForgotPasswordForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email field and submit button", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument();
  });

  it("shows validation error for empty email", async () => {
    render(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it("calls forgot-password API with valid email", async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: "test@test.com" });
    });
  });

  it("shows success message after sending", async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument();
      expect(screen.getByText(/sent a password reset link/i)).toBeInTheDocument();
    });
  });

  it("displays API error on failure", async () => {
    const { ApiError } = await import("@/lib/api-client");
    mockForgotPassword.mockRejectedValueOnce(new ApiError("RATE_LIMIT", "Too many requests", 429));
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("has link back to sign in", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByText("Back to sign in")).toHaveAttribute("href", "/login");
  });
});
