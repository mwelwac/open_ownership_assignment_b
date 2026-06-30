import {
  CheckCircle2,
  Edit3,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui";
import type { ApplicationAction, ApplicationStatus } from "@/features/applications/model";

export interface TransitionDialogConfig {
  status: ApplicationStatus;
  title: string;
  description: string;
  confirmLabel: string;
  commentRequired?: boolean;
  danger?: boolean;
}

export function ApplicationActions({
  actions,
  onDelete,
  onEdit,
  onTransition,
}: {
  actions: ApplicationAction[];
  onDelete: () => void;
  onEdit: () => void;
  onTransition: (config: TransitionDialogConfig) => void;
}) {
  return (
    <>
      {actions.includes("edit") && (
        <Button variant="outline" onClick={onEdit}>
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
      )}
      {actions.includes("delete") && (
        <Button variant="danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
      {actions.includes("submit") && (
        <Button
          onClick={() =>
            onTransition({
              status: "SUBMITTED",
              title: "Submit application?",
              description:
                "You will no longer be able to edit this application while it is being reviewed.",
              confirmLabel: "Submit application",
            })
          }
        >
          <Send className="h-4 w-4" />
          Submit
        </Button>
      )}
      {actions.includes("start_review") && (
        <Button
          onClick={() =>
            onTransition({
              status: "UNDER_REVIEW",
              title: "Start reviewing this application?",
              description: "The applicant will see that review is in progress.",
              confirmLabel: "Start review",
            })
          }
        >
          <ShieldCheck className="h-4 w-4" />
          Start review
        </Button>
      )}
      {actions.includes("approve") && (
        <Button
          onClick={() =>
            onTransition({
              status: "APPROVED",
              title: "Approve this application?",
              description: "This records a final approval decision.",
              confirmLabel: "Approve application",
            })
          }
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
      )}
      {actions.includes("request_changes") && (
        <Button
          variant="secondary"
          onClick={() =>
            onTransition({
              status: "DRAFT",
              title: "Request changes",
              description: "Explain what the applicant must update before resubmitting.",
              confirmLabel: "Return to applicant",
              commentRequired: true,
            })
          }
        >
          <RotateCcw className="h-4 w-4" />
          Request changes
        </Button>
      )}
      {actions.includes("reject") && (
        <Button
          variant="danger"
          onClick={() =>
            onTransition({
              status: "REJECTED",
              title: "Reject this application",
              description: "Provide a clear reason for the rejection.",
              confirmLabel: "Reject application",
              commentRequired: true,
              danger: true,
            })
          }
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      )}
    </>
  );
}
