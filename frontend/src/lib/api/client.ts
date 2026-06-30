const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
let csrfRequest: Promise<void> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export interface ApiErrorEnvelope {
  code: string;
  detail: string;
  errors: Record<string, unknown> | null;
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.detail === "string" &&
    (candidate.errors === null ||
      (typeof candidate.errors === "object" && !Array.isArray(candidate.errors)))
  );
}

export class ApiProtocolError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
  ) {
    super(`API error ${status} did not use the required error envelope.`);
    this.name = "ApiProtocolError";
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: ApiErrorEnvelope,
  ) {
    super(payload.detail);
    this.name = "ApiError";
  }

  get code(): string {
    return this.payload.code;
  }

  get detail(): string {
    return this.payload.detail;
  }

  get fieldErrors(): Record<string, string[]> | null {
    if (!this.payload.errors) return null;
    const result: Record<string, string[]> = {};
    for (const [field, raw] of Object.entries(this.payload.errors)) {
      if (typeof raw === "string") result[field] = [raw];
      if (Array.isArray(raw)) {
        const messages = raw.filter((value): value is string => typeof value === "string");
        if (messages.length) result[field] = messages;
      }
    }
    return Object.keys(result).length ? result : null;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (response.status === 204 || !contentType.includes("application/json")) return null;
  return response.json();
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("csrftoken")) return;
  if (!csrfRequest) {
    csrfRequest = fetch("/api/v1/auth/csrf/", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.ok) return;
        const payload = await parseJsonResponse(response);
        if (!isApiErrorEnvelope(payload)) throw new ApiProtocolError(response.status, payload);
        throw new ApiError(response.status, payload);
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  await csrfRequest;
}

async function prepareRequest({
  body,
  headers,
  method = "GET",
  ...rest
}: RequestOptions = {}): Promise<RequestInit> {
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has("Accept")) finalHeaders.set("Accept", "application/json");
  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      finalHeaders.set("Content-Type", "application/json");
      finalBody = JSON.stringify(body);
    }
  }

  if (!SAFE_METHODS.has(method.toUpperCase())) {
    await ensureCsrfCookie();
    const token = readCookie("csrftoken");
    if (!token) throw new Error("The CSRF cookie could not be initialized.");
    finalHeaders.set("X-CSRFToken", token);
  }

  return { ...rest, method, headers: finalHeaders, body: finalBody, credentials: "include" };
}

async function checkedResponse(path: string, options: RequestOptions = {}): Promise<Response> {
  const response = await fetch(path, await prepareRequest(options));
  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    if (!isApiErrorEnvelope(payload)) throw new ApiProtocolError(response.status, payload);
    throw new ApiError(response.status, payload);
  }
  return response;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return (await parseJsonResponse(await checkedResponse(path, options))) as T;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function apiPage<T>(path: string, options?: RequestOptions): Promise<Paginated<T>> {
  return apiRequest<Paginated<T>>(path, options);
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
  contentType: string;
}

function responseFilename(response: Response): string | null {
  const value = response.headers.get("Content-Disposition") ?? "";
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export async function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<DownloadedFile> {
  const response = await checkedResponse(path, options);
  return {
    blob: await response.blob(),
    filename: responseFilename(response),
    contentType: response.headers.get("Content-Type") ?? "application/octet-stream",
  };
}

export function initializeCsrf(): Promise<void> {
  return ensureCsrfCookie();
}
