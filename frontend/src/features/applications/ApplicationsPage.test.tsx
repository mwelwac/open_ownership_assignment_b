import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationsPage } from "@/features/applications/ApplicationsPage";

const state = vi.hoisted(() => ({ role: "APPLICANT" as "APPLICANT" | "REVIEWER" }));

vi.mock("@/features/auth/hooks", () => ({
  useMe: () => ({
    data: { id: 1, role: state.role, full_name: "Test User", email: "test@example.com" },
  }),
}));

vi.mock("@/features/applications/hooks", () => ({
  useApplications: () => ({
    isPending: false,
    isError: false,
    isFetching: false,
    data: { count: 0, next: null, previous: null, results: [] },
  }),
}));

describe("applications workbench", () => {
  beforeEach(() => {
    state.role = "APPLICANT";
  });

  it("shows the applicant workbench and creation action", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ApplicationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "My applications" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /new application/i })).toHaveLength(2);
  });

  it("shows reviewer queue tabs without applicant creation", () => {
    state.role = "REVIEWER";
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ApplicationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Review queue" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Submitted" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("button", { name: /new application/i })).not.toBeInTheDocument();
  });
});
