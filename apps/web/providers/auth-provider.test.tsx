import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth-provider";

const { mockPush, mockApi } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockApi: {
    auth: {
      login: vi.fn(),
      signup: vi.fn(),
      getProfile: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function TestConsumer() {
  const { user, isLoading, isAuthenticated, login, signup, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button onClick={() => login("test@test.com", "pass123")}>login</button>
      <button onClick={() => signup("new@test.com", "pass123", "New User")}>signup</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts not loading and unauthenticated when no token exists", async () => {
    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("fetches profile on mount when token exists", async () => {
    localStorage.setItem("access_token", "valid-token");
    mockApi.auth.getProfile.mockResolvedValueOnce({ id: "1", email: "alice@test.com", fullName: "Alice" });

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("alice@test.com");
    expect(mockApi.auth.getProfile).toHaveBeenCalled();
  });

  it("clears token and sets unauthenticated when profile fetch fails", async () => {
    localStorage.setItem("access_token", "expired-token");
    mockApi.auth.getProfile.mockRejectedValueOnce(new Error("Unauthorized"));

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("login stores tokens, fetches profile, and redirects to dashboard", async () => {
    mockApi.auth.login.mockResolvedValueOnce({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    mockApi.auth.getProfile.mockResolvedValueOnce({ id: "1", email: "test@test.com", fullName: "Test" });

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });
    expect(localStorage.getItem("access_token")).toBe("new-access");
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("signup calls signup then login, stores tokens, and redirects", async () => {
    mockApi.auth.signup.mockResolvedValueOnce(undefined);
    mockApi.auth.login.mockResolvedValueOnce({ accessToken: "at", refreshToken: "rt" });
    mockApi.auth.getProfile.mockResolvedValueOnce({ id: "2", email: "new@test.com", fullName: "New User" });

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      screen.getByText("signup").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });
    expect(mockApi.auth.signup).toHaveBeenCalledWith({
      email: "new@test.com",
      password: "pass123",
      fullName: "New User",
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("logout clears tokens, user, and redirects to login", async () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("refresh_token", "refresh");
    mockApi.auth.getProfile.mockResolvedValueOnce({ id: "1", email: "alice@test.com", fullName: "Alice" });

    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("useAuth throws when used outside AuthProvider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow("useAuth must be used within an AuthProvider");
  });
});
