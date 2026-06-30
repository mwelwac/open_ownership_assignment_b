import type { components } from "@/lib/api/generated";
import type { User } from "@/features/auth/api";

export type Application = components["schemas"]["Application"];
export type StatusTransition = components["schemas"]["StatusTransition"];
export type ApplicationStatus = components["schemas"]["ApplicationStatusEnum"];
export type ApplicationCategory = components["schemas"]["ApplicationCategoryEnum"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const CATEGORY_LABELS: Record<ApplicationCategory, string> = {
  NAME_CLEARANCE: "Name Clearance",
  INCORPORATION: "Incorporation",
  BO_DECLARATION: "Business Ownership Declaration",
  DETAILS_UPDATE: "Details Update",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [ApplicationCategory, string][];
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [ApplicationStatus, string][];

export type ApplicationAction =
  "edit" | "delete" | "submit" | "start_review" | "approve" | "reject" | "request_changes";

export function availableApplicationActions(
  application: Application,
  user: User,
): ApplicationAction[] {
  if (user.role === "APPLICANT") {
    return application.owner.id === user.id && application.status === "DRAFT"
      ? ["edit", "delete", "submit"]
      : [];
  }
  if (user.role === "REVIEWER") {
    if (application.status === "SUBMITTED") return ["start_review"];
    if (application.status === "UNDER_REVIEW") return ["approve", "reject", "request_changes"];
  }
  return [];
}

function latestTransition(application: Application): StatusTransition | null {
  return application.transitions.at(-1) ?? null;
}

export function latestChangeRequest(application: Application): StatusTransition | null {
  const latest = latestTransition(application);
  if (
    application.status === "DRAFT" &&
    latest?.from_status === "UNDER_REVIEW" &&
    latest.to_status === "DRAFT"
  ) {
    return latest;
  }
  return null;
}

export function isChangesRequested(application: Application): boolean {
  return Boolean(latestChangeRequest(application));
}

export function applicationStatusLabel(application: Application): string {
  return isChangesRequested(application) ? "Changes requested" : STATUS_LABELS[application.status];
}

export function validateAttachment(file: File): string | null {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedExtension = /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!allowedTypes.includes(file.type) || !allowedExtension)
    return "Choose a PDF, JPEG, or PNG file.";
  if (file.size > 10 * 1024 * 1024) return "Attachments may not exceed 10 MB.";
  return null;
}
