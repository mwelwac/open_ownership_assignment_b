import { apiPage, apiRequest, type Paginated } from "@/lib/api/client";
import type { components } from "@/lib/api/generated";

export type Notification = components["schemas"]["Notification"];
type MarkAllReadResponse = components["schemas"]["MarkAllRead"];
type UnreadCountResponse = components["schemas"]["UnreadCount"];

export const notificationsApi = {
  list: (page = 1, pageSize = 10): Promise<Paginated<Notification>> => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    return apiPage<Notification>(`/api/v1/notifications/?${params}`);
  },
  unreadCount: () => apiRequest<UnreadCountResponse>("/api/v1/notifications/unread-count/"),
  markRead: (id: number) =>
    apiRequest<Notification>(`/api/v1/notifications/${id}/read/`, { method: "POST" }),
  markAllRead: () =>
    apiRequest<MarkAllReadResponse>("/api/v1/notifications/read-all/", { method: "POST" }),
};
