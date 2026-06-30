import { apiRequest, initializeCsrf } from "@/lib/api/client";
import type { components } from "@/lib/api/generated";

export type User = components["schemas"]["User"];
export type LoginPayload = components["schemas"]["LoginRequest"];
export type RegistrationPayload = components["schemas"]["RegistrationRequest"];
export type ReviewerRegistrationPayload = components["schemas"]["ReviewerCreateRequest"];
export type PasswordChangePayload = components["schemas"]["PasswordChangeRequest"];
type DetailResponse = components["schemas"]["Detail"];
type PasswordResetRequestPayload = components["schemas"]["PasswordResetRequestRequest"];
type PasswordResetConfirmPayload = components["schemas"]["PasswordResetConfirmRequestRequest"];

export const authApi = {
  csrf: initializeCsrf,
  login: (payload: LoginPayload) =>
    apiRequest<User>("/api/v1/auth/login/", { method: "POST", body: payload }),
  register: (payload: RegistrationPayload) =>
    apiRequest<User>("/api/v1/auth/register/", { method: "POST", body: payload }),
  registerReviewer: (payload: ReviewerRegistrationPayload) =>
    apiRequest<User>("/api/v1/auth/reviewer/register/", { method: "POST", body: payload }),
  logout: () => apiRequest<void>("/api/v1/auth/logout/", { method: "POST" }),
  me: () => apiRequest<User>("/api/v1/auth/me/"),
  changePassword: (payload: PasswordChangePayload) =>
    apiRequest<void>("/api/v1/auth/password/change/", { method: "POST", body: payload }),
  requestReset: (payload: PasswordResetRequestPayload) =>
    apiRequest<DetailResponse>("/api/v1/auth/password/reset/", {
      method: "POST",
      body: payload,
    }),
  confirmReset: (uid: string, token: string, payload: PasswordResetConfirmPayload) =>
    apiRequest<void>(
      `/api/v1/auth/password/reset/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
      { method: "POST", body: payload },
    ),
};
