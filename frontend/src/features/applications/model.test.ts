import { describe, expect, it } from "vitest";

import {
  applicationStatusLabel,
  availableApplicationActions,
  isChangesRequested,
  validateAttachment,
  type Application,
} from "@/features/applications/model";
import type { User } from "@/features/auth/api";

const applicant = { id: 1, role: "APPLICANT" } as User;
const reviewer = { id: 2, role: "REVIEWER" } as User;
const application = { id: 10, owner: { id: 1 }, status: "DRAFT" } as Application;

describe("application role actions", () => {
  it("allows the owner to manage and submit a draft", () => {
    expect(availableApplicationActions(application, applicant)).toEqual([
      "edit",
      "delete",
      "submit",
    ]);
  });

  it("offers the reviewer only legal workflow transitions", () => {
    expect(availableApplicationActions({ ...application, status: "SUBMITTED" }, reviewer)).toEqual([
      "start_review",
    ]);
    expect(
      availableApplicationActions({ ...application, status: "UNDER_REVIEW" }, reviewer),
    ).toEqual(["approve", "reject", "request_changes"]);
    expect(availableApplicationActions({ ...application, status: "APPROVED" }, reviewer)).toEqual(
      [],
    );
  });
});

describe("application status presentation", () => {
  it("presents returned drafts as changes requested", () => {
    const returnedApplication = {
      ...application,
      transitions: [
        {
          id: 1,
          actor: {
            id: 2,
            email: "reviewer@example.com",
            full_name: "Review User",
            role: "REVIEWER",
          },
          from_status: "UNDER_REVIEW",
          to_status: "DRAFT",
          comment: "Please revise the attachment.",
          created_at: "2026-06-30T08:00:00Z",
        },
      ],
    } as Application;

    expect(isChangesRequested(returnedApplication)).toBe(true);
    expect(applicationStatusLabel(returnedApplication)).toBe("Changes requested");
  });
});

describe("attachment validation", () => {
  it("accepts supported files within 10 MB", () => {
    expect(
      validateAttachment(new File(["%PDF"], "record.pdf", { type: "application/pdf" })),
    ).toBeNull();
  });

  it("rejects unsupported types and oversized files", () => {
    expect(validateAttachment(new File(["x"], "record.txt", { type: "text/plain" }))).toContain(
      "PDF",
    );
    expect(
      validateAttachment(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
      ),
    ).toContain("10 MB");
  });
});
