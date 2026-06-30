import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NotificationBell } from "@/features/notifications/NotificationBell";

const markRead = vi.fn();
const markAllRead = vi.fn();

vi.mock("@/features/notifications/hooks", () => ({
  useNotifications: () => ({
    isPending: false,
    isError: false,
    data: {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          event_type: "CHANGES_REQUESTED",
          title: "Changes requested",
          message: "A reviewer requested changes.",
          application_id: 42,
          application_title: "Reserve a company name",
          is_read: false,
          read_at: null,
          created_at: "2026-06-30T08:00:00Z",
        },
      ],
    },
  }),
  useUnreadNotificationCount: () => ({ data: { count: 1 } }),
  useMarkNotificationRead: () => ({ mutateAsync: markRead }),
  useMarkAllNotificationsRead: () => ({ mutate: markAllRead, isPending: false }),
}));

describe("notification bell", () => {
  it("opens notifications and marks a clicked notification read", async () => {
    markRead.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <NotificationBell />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Changes requested")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Changes requested/i }));

    expect(markRead).toHaveBeenCalledWith(1);
  });
});
