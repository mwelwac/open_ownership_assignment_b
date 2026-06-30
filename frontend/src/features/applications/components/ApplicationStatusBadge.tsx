import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

import {
  applicationStatusLabel,
  isChangesRequested,
  type Application,
  type ApplicationStatus,
} from "../model";

const STATUS_BADGE_CLASSES = {
  DRAFT: "border-[#d0d5dd] bg-[#f2f4f7] text-[#475467]",
  SUBMITTED: "border-[#b2ccff] bg-[#eff4ff] text-[#1849a9]",
  UNDER_REVIEW: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
  APPROVED: "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",
  REJECTED: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
} satisfies Record<ApplicationStatus, string>;

const CHANGES_REQUESTED_BADGE_CLASSES = "border-[#fedf89] bg-[#fffaeb] text-[#b54708]";

export function ApplicationStatusBadge({ application }: { application: Application }) {
  return (
    <Badge
      className={cn(
        isChangesRequested(application)
          ? CHANGES_REQUESTED_BADGE_CLASSES
          : STATUS_BADGE_CLASSES[application.status],
      )}
    >
      {applicationStatusLabel(application)}
    </Badge>
  );
}
