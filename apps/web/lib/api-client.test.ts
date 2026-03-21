import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "./api-client";

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function mockFetch(status: number, body?: unknown) {
    const fn = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
    globalThis.fetch = fn;
    return fn;
  }

  describe("headers", () => {
    it("sends Content-Type json by default", async () => {
      const fetchSpy = mockFetch(200, []);

      await api.organizations.list();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("includes Authorization header when token exists", async () => {
      localStorage.setItem("access_token", "my-token");
      const fetchSpy = mockFetch(200, []);

      await api.organizations.list();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        }),
      );
    });

    it("does not include Authorization header when no token", async () => {
      const fetchSpy = mockFetch(200, []);

      await api.organizations.list();

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty("Authorization");
    });
  });

  describe("methods", () => {
    it("GET sends correct path", async () => {
      const fetchSpy = mockFetch(200, []);

      await api.organizations.list();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/organizations"),
        expect.any(Object),
      );
    });

    it("POST sends JSON body", async () => {
      const fetchSpy = mockFetch(200, { id: "1", name: "Test", slug: "test", type: "team", createdAt: "", updatedAt: "" });

      await api.organizations.create({ name: "Test", slug: "test" });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/organizations"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Test", slug: "test" }),
        }),
      );
    });

    it("PATCH sends JSON body", async () => {
      const fetchSpy = mockFetch(200, { id: "1", name: "Updated", slug: "updated", type: "team", createdAt: "", updatedAt: "" });

      await api.organizations.update("1", { name: "Updated", slug: "updated" });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/organizations/1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Updated", slug: "updated" }),
        }),
      );
    });

    it("DELETE sends correct method", async () => {
      const fetchSpy = mockFetch(204, undefined);

      await api.organizations.delete("1");

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/organizations/1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("error handling", () => {
    it("throws ApiError with code and message from API error response", async () => {
      mockFetch(409, { error: { code: "SLUG_TAKEN", message: "Slug already exists" } });

      try {
        await api.organizations.create({ name: "Test", slug: "taken" });
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        const err = e as ApiError;
        expect(err.code).toBe("SLUG_TAKEN");
        expect(err.message).toBe("Slug already exists");
        expect(err.status).toBe(409);
      }
    });

    it("throws ApiError with UNKNOWN_ERROR when response has no error body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      });

      try {
        await api.organizations.list();
      } catch (e) {
        const err = e as ApiError;
        expect(err.code).toBe("UNKNOWN_ERROR");
        expect(err.status).toBe(500);
      }
    });
  });

  describe("response handling", () => {
    it("returns parsed JSON on success", async () => {
      mockFetch(200, { id: "1", email: "test@test.com", fullName: null, avatarUrl: null, createdAt: "", updatedAt: "" });

      const result = await api.auth.getProfile();

      expect(result.id).toBe("1");
      expect(result.email).toBe("test@test.com");
    });

    it("returns undefined on 204 No Content", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

      const result = await api.organizations.delete("1");

      expect(result).toBeUndefined();
    });
  });
});
