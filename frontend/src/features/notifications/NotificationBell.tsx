import { Popover } from "@base-ui-components/react/popover";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Spinner } from "@/components/ui";
import type { Notification } from "@/features/notifications/api";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notifications = useNotifications(1, 10);
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = unread.data?.count ?? 0;

  const openNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      await markRead.mutateAsync(notification.id);
    }
    setOpen(false);
    navigate(`/applications/${notification.application_id}`);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cfd7e4] bg-white text-[#344054] shadow-sm hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-[#e6a21a] px-1.5 py-0.5 text-[10px] leading-none font-bold text-[#102a56]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8}>
          <Popover.Popup className="z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#dde3ec] bg-white text-left shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between gap-3 border-b border-[#e4e9f0] px-4 py-3">
              <div>
                <Popover.Title className="text-sm font-semibold text-[#182235]">
                  Notifications
                </Popover.Title>
                <Popover.Description className="text-xs text-[#667085]">
                  {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
                </Popover.Description>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!unreadCount || markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-4 w-4" />
                Mark read
              </Button>
            </div>
            {notifications.isPending ? (
              <div className="flex min-h-32 items-center justify-center">
                <Spinner label="Loading…" />
              </div>
            ) : notifications.isError ? (
              <div className="px-4 py-6 text-sm text-[#b42318]">
                Notifications could not be loaded.
              </div>
            ) : notifications.data.results.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-[#98a2b3]" />
                <p className="mt-2 text-sm font-semibold text-[#344054]">No notifications yet</p>
                <p className="mt-1 text-xs text-[#667085]">
                  Status changes and reviewer feedback will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                {notifications.data.results.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={cn(
                      "block w-full border-b border-[#edf0f4] px-4 py-3 text-left hover:bg-[#f8fafc]",
                      !notification.is_read && "bg-[#fffaf0]",
                    )}
                    onClick={() => void openNotification(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-1 h-2 w-2 shrink-0 rounded-full",
                          notification.is_read ? "bg-[#d0d5dd]" : "bg-[#e6a21a]",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#182235]">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#667085]">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium text-[#98a2b3]">
                          {formatDateTime(notification.created_at)}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
