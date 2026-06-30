import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ReviewersPage } from "@/features/reviewers/ReviewersPage";

const createReviewer = vi.fn();

vi.mock("@/features/reviewers/hooks", () => ({
  useReviewers: () => ({
    isPending: false,
    isError: false,
    isFetching: false,
    data: { count: 0, next: null, previous: null, results: [] },
  }),
  useCreateReviewer: () => ({ mutateAsync: createReviewer }),
}));

describe("reviewer management", () => {
  it("creates a reviewer from the staff management form", async () => {
    createReviewer.mockResolvedValue({
      id: 2,
      uuid: "reviewer-uuid",
      email: "reviewer@example.com",
      first_name: "Review",
      last_name: "User",
      full_name: "Review User",
      role: "REVIEWER",
      is_staff: false,
      is_superuser: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ReviewersPage />
      </MemoryRouter>,
    );

    const addButtons = screen.getAllByRole("button", { name: "Add reviewer" });
    expect(addButtons).toHaveLength(2);
    await user.click(addButtons[0]);
    await user.type(screen.getByLabelText("First name"), "Review");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email address"), "reviewer@example.com");
    await user.type(screen.getByLabelText("Temporary password"), "Strongest-Password-2026!");
    await user.type(
      screen.getByLabelText("Confirm temporary password"),
      "Strongest-Password-2026!",
    );
    await user.click(screen.getByRole("button", { name: "Create reviewer" }));

    expect(createReviewer).toHaveBeenCalledWith({
      first_name: "Review",
      last_name: "User",
      email: "reviewer@example.com",
      password: "Strongest-Password-2026!",
      password_confirm: "Strongest-Password-2026!",
    });
  });
});
