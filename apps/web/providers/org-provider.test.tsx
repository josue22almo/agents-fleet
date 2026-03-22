import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OrgProvider, useCurrentOrg } from "./org-provider";

const { mockOrgs } = vi.hoisted(() => ({
  mockOrgs: vi.fn(),
}));

vi.mock("@/hooks/use-organizations", () => ({
  useOrganizations: () => ({ data: mockOrgs() }),
}));

function TestConsumer() {
  const { orgs, currentOrg, selectOrg } = useCurrentOrg();

  return (
    <div>
      <span data-testid="current">{currentOrg?.name ?? "none"}</span>
      <span data-testid="count">{orgs.length}</span>
      {orgs.map((org) => (
        <button key={org.id} onClick={() => selectOrg(org)}>
          {org.name}
        </button>
      ))}
    </div>
  );
}

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrgProvider>{ui}</OrgProvider>
    </QueryClientProvider>,
  );
}

const orgA = { id: "1", name: "Org A", slug: "org-a", type: "team", memberCount: 2, canCurrentUserManage: true };
const orgB = { id: "2", name: "Org B", slug: "org-b", type: "team", memberCount: 1, canCurrentUserManage: false };

describe("OrgProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to the first org", () => {
    mockOrgs.mockReturnValue([orgA, orgB]);
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("current").textContent).toBe("Org A");
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("shows none when no orgs", () => {
    mockOrgs.mockReturnValue(undefined);
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("current").textContent).toBe("none");
  });

  it("switches org when selectOrg is called", async () => {
    mockOrgs.mockReturnValue([orgA, orgB]);
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("current").textContent).toBe("Org A");

    await act(async () => {
      screen.getByText("Org B").click();
    });

    expect(screen.getByTestId("current").textContent).toBe("Org B");
  });

  it("shares state between multiple consumers", async () => {
    mockOrgs.mockReturnValue([orgA, orgB]);

    function SecondConsumer() {
      const { currentOrg } = useCurrentOrg();
      return <span data-testid="second">{currentOrg?.name ?? "none"}</span>;
    }

    renderWithProviders(
      <>
        <TestConsumer />
        <SecondConsumer />
      </>,
    );

    expect(screen.getByTestId("current").textContent).toBe("Org A");
    expect(screen.getByTestId("second").textContent).toBe("Org A");

    await act(async () => {
      screen.getByText("Org B").click();
    });

    expect(screen.getByTestId("current").textContent).toBe("Org B");
    expect(screen.getByTestId("second").textContent).toBe("Org B");
  });

  it("throws when used outside OrgProvider", () => {
    function Orphan() {
      useCurrentOrg();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow("useCurrentOrg must be used within an OrgProvider");
  });
});
