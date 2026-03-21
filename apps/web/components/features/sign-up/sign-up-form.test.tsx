import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "./sign-up-form";

const mockSignup = vi.fn();
vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ signup: mockSignup }),
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

describe("SignUpForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("shows validation error for empty email", async () => {
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("shows validation error for short password", async () => {
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("calls signup with valid data including full name", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Full Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("john@test.com", "password123", "John Doe");
    });
  });

  it("calls signup without full name when not provided", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("john@test.com", "password123", undefined);
    });
  });

  it("displays API error on signup failure", async () => {
    const { ApiError } = await import("@/lib/api-client");
    mockSignup.mockRejectedValueOnce(new ApiError("EMAIL_EXISTS", "Email already registered", 409));
    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "taken@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument();
    });
  });

  it("has link to sign in", () => {
    render(<SignUpForm />);

    expect(screen.getByText("Sign in")).toHaveAttribute("href", "/login");
  });
});
