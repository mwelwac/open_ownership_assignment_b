import {
  apiDownload,
  apiPage,
  apiRequest,
  type DownloadedFile,
  type Paginated,
} from "@/lib/api/client";
import type {
  Application,
  ApplicationCategory,
  ApplicationStatus,
} from "@/features/applications/model";

export interface ApplicationListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: ApplicationStatus;
  category?: ApplicationCategory;
  ordering?: string;
}

export interface ApplicationFormPayload {
  title: string;
  category: ApplicationCategory;
  description: string;
  amount: string | null;
  attachment?: File | null;
}

function requestBody(payload: ApplicationFormPayload): Record<string, unknown> | FormData {
  if (payload.attachment instanceof File) {
    const data = new FormData();
    data.append("title", payload.title);
    data.append("category", payload.category);
    data.append("description", payload.description);
    if (payload.amount) data.append("amount", payload.amount);
    data.append("attachment", payload.attachment);
    return data;
  }
  const body: Record<string, unknown> = {
    title: payload.title,
    category: payload.category,
    description: payload.description,
    amount: payload.amount,
  };
  if (payload.attachment === null) body.attachment = null;
  return body;
}

export const applicationsApi = {
  list(params: ApplicationListParams): Promise<Paginated<Application>> {
    const query = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.pageSize),
    });
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.category) query.set("category", params.category);
    if (params.ordering) query.set("ordering", params.ordering);
    return apiPage<Application>(`/api/v1/applications/?${query}`);
  },
  get: (id: number) => apiRequest<Application>(`/api/v1/applications/${id}/`),
  create: (payload: ApplicationFormPayload) =>
    apiRequest<Application>("/api/v1/applications/", {
      method: "POST",
      body: requestBody(payload),
    }),
  update: (id: number, payload: ApplicationFormPayload) =>
    apiRequest<Application>(`/api/v1/applications/${id}/`, {
      method: "PATCH",
      body: requestBody(payload),
    }),
  remove: (id: number) => apiRequest<void>(`/api/v1/applications/${id}/`, { method: "DELETE" }),
  transition: (id: number, toStatus: ApplicationStatus, comment = "") =>
    apiRequest<Application>(`/api/v1/applications/${id}/transition/`, {
      method: "POST",
      body: { to_status: toStatus, comment },
    }),
  downloadAttachment: (id: number): Promise<DownloadedFile> =>
    apiDownload(`/api/v1/applications/${id}/attachment/`, {
      headers: { Accept: "application/octet-stream" },
    }),
};
