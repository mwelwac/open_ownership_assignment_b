import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, ApiProtocolError, apiDownload, apiRequest } from "@/lib/api/client";

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("API client", () => {
  beforeEach(() => {
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes CSRF once for concurrent unsafe requests", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        document.cookie = "csrftoken=token-123; path=/";
        return jsonResponse({ detail: "CSRF cookie set." });
      })
      .mockResolvedValueOnce(jsonResponse({ id: 1 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      apiRequest("/one", { method: "POST", body: { value: 1 } }),
      apiRequest("/two", { method: "POST", body: { value: 2 } }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([path]) => path === "/api/v1/auth/csrf/")).toHaveLength(1);
    const request = fetchMock.mock.calls.find(([path]) => path === "/one")?.[1] as RequestInit;
    expect(new Headers(request.headers).get("X-CSRFToken")).toBe("token-123");
  });

  it("throws ApiError and exposes canonical field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            code: "invalid",
            detail: "Request validation failed.",
            errors: { title: ["This field is required."] },
          },
          400,
        ),
      ),
    );
    await expect(apiRequest("/api/v1/applications/")).rejects.toMatchObject({
      status: 400,
      detail: "Request validation failed.",
      fieldErrors: { title: ["This field is required."] },
    } satisfies Partial<ApiError>);
  });

  it("rejects error responses that violate the envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "raw error" }, 500)));
    await expect(apiRequest("/broken")).rejects.toBeInstanceOf(ApiProtocolError);
  });

  it("handles 204 responses without parsing JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest<void>("/empty")).resolves.toBeNull();
  });

  it("downloads binary responses and reads the server filename", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["file"]), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=record.pdf",
          },
        }),
      ),
    );
    const result = await apiDownload("/attachment");
    expect(result.filename).toBe("record.pdf");
    expect(result.contentType).toBe("application/pdf");
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
