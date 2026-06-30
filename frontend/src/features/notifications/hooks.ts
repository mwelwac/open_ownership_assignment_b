import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "@/features/notifications/api";

const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, pageSize: number) =>
    [...notificationKeys.all, "list", page, pageSize] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: notificationKeys.list(page, pageSize),
    queryFn: () => notificationsApi.list(page, pageSize),
    staleTime: 15_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

function useRefreshNotifications() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
}

export function useMarkNotificationRead() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: refresh,
  });
}

export function useMarkAllNotificationsRead() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refresh,
  });
}
