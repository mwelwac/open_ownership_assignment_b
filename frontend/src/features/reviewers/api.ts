import type { User } from "@/features/auth/api";
import { apiPage, apiRequest, type Paginated } from "@/lib/api/client";
import type { components } from "@/lib/api/generated";

export type ReviewerCreatePayload = components["schemas"]["ReviewerCreateRequest"];

export const reviewersApi = {
  list: (page: number, pageSize: number): Promise<Paginated<User>> => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    return apiPage<User>(`/api/v1/auth/reviewers/?${params}`);
  },
  create: (payload: ReviewerCreatePayload) =>
    apiRequest<User>("/api/v1/auth/reviewers/", {
      method: "POST",
      body: payload,
    }),
};
