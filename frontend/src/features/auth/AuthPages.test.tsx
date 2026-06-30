import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ReviewerLoginPage, ReviewerRegisterPage } from "@/features/auth/AuthPages";

const registerReviewer = vi.fn();

vi.mock("@/features/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/api")>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      csrf: vi.fn(() => Promise.resolve()),
    },
  };
});

vi.mock("@/features/auth/hooks", () => ({
  useMe: () => ({ data: null, isPending: false }),
  useLogin: () => ({ mutateAsync: vi.fn() }),
  useRegister: () => ({ mutateAsync: vi.fn() }),
  useRegisterReviewer: () => ({ mutateAsync: registerReviewer }),
}));

describe("reviewer portal auth pages", () => {
  it("shows a reviewer-branded login page", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ReviewerLoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Reviewer Portal" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to review submitted applications.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create reviewer account" })).toHaveAttribute(
      "href",
      "/reviewer/register",
    );
  });

  it("creates a reviewer account from the reviewer portal registration page", async () => {
    registerReviewer.mockResolvedValue({
      id: 7,
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
        <ReviewerRegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("First name"), "Review");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email address"), "reviewer@example.com");
    await user.type(screen.getByLabelText("Password"), "Strongest-Password-2026!");
    await user.type(screen.getByLabelText("Confirm password"), "Strongest-Password-2026!");
    await user.click(screen.getByRole("button", { name: "Create reviewer account" }));

    expect(registerReviewer).toHaveBeenCalledWith({
      first_name: "Review",
      last_name: "User",
      email: "reviewer@example.com",
      password: "Strongest-Password-2026!",
      password_confirm: "Strongest-Password-2026!",
    });
  });
});
