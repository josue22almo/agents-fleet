import type {
  LoginRequest,
  SignUpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  AuthTokensResponse,
  ProfileResponse,
  CreateOrgRequest,
  UpdateOrgRequest,
  OrgResponse,
  OrgListItemResponse,
  InviteMemberRequest,
  ChangeMemberRoleRequest,
  MemberResponse,
  InviteDetailsResponse,
} from "@repo/contracts/iam";

import type {
  CreateAgentRequest,
  UpdateAgentRequest,
  AgentResponse,
  AgentListItemResponse,
  AgentWithTokenResponse,
  AgentMetricsResponse,
  DashboardMetricsResponse,
  DashboardChartDataResponse,
  AgentComparisonResponse,
  AgentUsageStatsResponse,
  ToolCallSummaryResponse,
  PaginatedRunsResponse,
  PaginatedSessionsResponse,
  SessionWithRunsResponse,
} from "@repo/contracts/agents";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (body?.error) {
      throw new ApiError(body.error.code, body.error.message, res.status);
    }
    throw new ApiError("UNKNOWN_ERROR", `Request failed with status ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

function patch<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
}

function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export const api = {
  auth: {
    login: (data: LoginRequest) => post<AuthTokensResponse>("/auth/login", data),
    signup: (data: SignUpRequest) => post<void>("/auth/signup", data),
    forgotPassword: (data: ForgotPasswordRequest) => post<void>("/auth/forgot-password", data),
    resetPassword: (data: ResetPasswordRequest) => post<void>("/auth/reset-password", data),
    getProfile: () => get<ProfileResponse>("/auth/me"),
    updateProfile: (data: UpdateProfileRequest) => patch<ProfileResponse>("/auth/me", data),
    changePassword: (data: ChangePasswordRequest) => patch<void>("/auth/password", data),
  },
  organizations: {
    list: () => get<OrgListItemResponse[]>("/organizations"),
    create: (data: CreateOrgRequest) => post<OrgResponse>("/organizations", data),
    get: (id: string) => get<OrgResponse>(`/organizations/${id}`),
    update: (id: string, data: UpdateOrgRequest) => patch<OrgResponse>(`/organizations/${id}`, data),
    delete: (id: string) => del<void>(`/organizations/${id}`),
  },
  members: {
    list: (orgId: string) => get<MemberResponse[]>(`/organizations/${orgId}/members`),
    invite: (orgId: string, data: InviteMemberRequest) => post<void>(`/organizations/${orgId}/members`, data),
    changeRole: (orgId: string, memberId: string, data: ChangeMemberRoleRequest) =>
      patch<void>(`/organizations/${orgId}/members/${memberId}`, data),
    remove: (orgId: string, memberId: string) => del<void>(`/organizations/${orgId}/members/${memberId}`),
  },
  invitations: {
    get: (token: string) => get<InviteDetailsResponse>(`/invitations/${token}`),
    accept: (token: string) => post<void>(`/invitations/${token}/accept`),
    decline: (token: string) => post<void>(`/invitations/${token}/decline`),
  },
  agents: {
    list: (orgId: string) => get<AgentListItemResponse[]>(`/agents?organizationId=${orgId}`),
    create: (data: CreateAgentRequest) => post<AgentWithTokenResponse>("/agents", data),
    get: (id: string) => get<AgentResponse>(`/agents/${id}`),
    update: (id: string, data: UpdateAgentRequest) => patch<AgentResponse>(`/agents/${id}`, data),
    delete: (id: string) => del<void>(`/agents/${id}`),
    regenerateToken: (id: string) => post<AgentWithTokenResponse>(`/agents/${id}/regenerate-token`),
    runs: (id: string, page?: number) => get<PaginatedRunsResponse>(`/agents/${id}/runs?page=${page ?? 1}`),
    metrics: (id: string) => get<AgentMetricsResponse>(`/agents/${id}/metrics`),
    sessions: (id: string, page?: number) => get<PaginatedSessionsResponse>(`/agents/${id}/sessions?page=${page ?? 1}`),
    session: (id: string, sessionId: string) => get<SessionWithRunsResponse>(`/agents/${id}/sessions/${sessionId}`),
    dashboardMetrics: (orgId: string) => get<DashboardMetricsResponse>(`/dashboard/metrics?organizationId=${orgId}`),
    dashboardCharts: (orgId: string) => get<DashboardChartDataResponse>(`/dashboard/charts?organizationId=${orgId}`),
    dashboardComparison: (orgId: string) => get<AgentComparisonResponse>(`/dashboard/comparison?organizationId=${orgId}`),
    agentCharts: (id: string) => get<DashboardChartDataResponse>(`/agents/${id}/charts`),
    agentUsage: (id: string) => get<AgentUsageStatsResponse>(`/agents/${id}/usage`),
    tools: (id: string) => get<ToolCallSummaryResponse>(`/agents/${id}/tools`),
  },
  avatars: {
    upload: async (userId: string, file: File): Promise<string> => {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/avatar.${ext}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey,
          "x-upsert": "true",
          "Content-Type": file.type,
        },
        body: file,
      });
      if (!res.ok) throw new ApiError("UPLOAD_FAILED", "Avatar upload failed", res.status);
      return `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
    },
  },
};
