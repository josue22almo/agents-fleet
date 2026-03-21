import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./sign-in-form";

const mockLogin = vi.fn();
vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api-client", () => ({
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

describe("SignInForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<SignInForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with valid credentials", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
    });
  });

  it("displays API error message on login failure", async () => {
    const { ApiError } = await import("@/lib/api-client");
    mockLogin.mockRejectedValueOnce(new ApiError("INVALID_CREDENTIALS", "Invalid email or password", 401));
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("shows submitting state while logging in", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    });
  });

  it("has links to forgot password and sign up", () => {
    render(<SignInForm />);

    expect(screen.getByText("Forgot password?")).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByText("Sign up")).toHaveAttribute("href", "/signup");
  });
});
