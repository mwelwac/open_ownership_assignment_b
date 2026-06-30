import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { DetailItem, PageContainer, PageHeader } from "@/components/patterns";
import { Alert, Button, Card, Label, Modal, Spinner, Textarea } from "@/components/ui";
import { applicationsApi } from "@/features/applications/api";
import {
  ApplicationActions,
  type TransitionDialogConfig,
} from "@/features/applications/components/ApplicationActions";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { StatusTimeline } from "@/features/applications/components/StatusTimeline";
import {
  useApplication,
  useDeleteApplication,
  useTransitionApplication,
} from "@/features/applications/hooks";
import {
  availableApplicationActions,
  CATEGORY_LABELS,
  latestChangeRequest,
} from "@/features/applications/model";
import { useMe } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api/client";
import { formatAmount, formatDateTime } from "@/lib/format";

export function ApplicationDetailPage() {
  const id = Number(useParams().id);
  const { data: user } = useMe();
  const query = useApplication(id);
  const transition = useTransitionApplication(id);
  const remove = useDeleteApplication();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<TransitionDialogConfig | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (query.isPending)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading application…" />
      </div>
    );
  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <PageContainer narrow>
        <PageHeader
          title={notFound ? "Application not found" : "Unable to load application"}
          backTo={{ to: "/applications", label: "Back to applications" }}
        />
        <Alert>
          {notFound
            ? "This application does not exist or is not visible to your account."
            : "Please refresh and try again."}
        </Alert>
      </PageContainer>
    );
  }
  const application = query.data;
  const actions = user ? availableApplicationActions(application, user) : [];
  const changeRequest = latestChangeRequest(application);

  const openTransition = (config: TransitionDialogConfig) => {
    setComment("");
    setDialogError(null);
    setDialog(config);
  };
  const completeTransition = async () => {
    if (!dialog) return;
    if (dialog.commentRequired && !comment.trim()) {
      setDialogError("A comment is required for this action.");
      return;
    }
    try {
      await transition.mutateAsync({ status: dialog.status, comment: comment.trim() });
      toast.success("Application status updated.");
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof ApiError ? error.detail : "The status could not be updated.");
    }
  };
  const deleteApplication = async () => {
    try {
      await remove.mutateAsync(id);
      toast.success("Draft application deleted.");
      navigate("/applications", { replace: true });
    } catch (error) {
      setDialogError(
        error instanceof ApiError ? error.detail : "The application could not be deleted.",
      );
    }
  };
  const download = async () => {
    setDownloading(true);
    try {
      const file = await applicationsApi.downloadAttachment(id);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename ?? application.attachment_name ?? "attachment";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : "The attachment could not be downloaded.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const actionButtons = (
    <ApplicationActions
      actions={actions}
      onEdit={() => navigate(`/applications/${id}/edit`)}
      onDelete={() => {
        setDialogError(null);
        setDeleteOpen(true);
      }}
      onTransition={openTransition}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title={application.title}
        description={`${CATEGORY_LABELS[application.category]} · Application #${application.id}`}
        backTo={{ to: "/applications", label: "Back to applications" }}
        actions={actionButtons}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        <div className="space-y-5">
          {changeRequest && user?.role === "APPLICANT" && (
            <Alert variant="info">
              <span className="font-semibold">A reviewer requested changes.</span>
              {changeRequest.comment && (
                <span className="mt-1 block">“{changeRequest.comment}”</span>
              )}
              <span className="mt-1 block">
                Update the draft, then submit it again when you’re ready.
              </span>
            </Alert>
          )}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#182235]">Application details</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Submitted information and supporting documentation.
                </p>
              </div>
              <ApplicationStatusBadge application={application} />
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Category">{CATEGORY_LABELS[application.category]}</DetailItem>
              <DetailItem label="Amount">{formatAmount(application.amount)}</DetailItem>
              {user?.role === "REVIEWER" && (
                <>
                  <DetailItem label="Applicant">{application.owner.full_name}</DetailItem>
                  <DetailItem label="Applicant email">
                    <a
                      className="text-[#173a70] hover:underline"
                      href={`mailto:${application.owner.email}`}
                    >
                      {application.owner.email}
                    </a>
                  </DetailItem>
                </>
              )}
              <DetailItem label="Created">{formatDateTime(application.created_at)}</DetailItem>
              <DetailItem label="Last updated">{formatDateTime(application.updated_at)}</DetailItem>
            </dl>
            {application.description && (
              <div className="mt-6 border-t border-[#e4e9f0] pt-5">
                <h3 className="text-xs font-semibold tracking-wide text-[#7b879a] uppercase">
                  Description
                </h3>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-[#344054]">
                  {application.description}
                </p>
              </div>
            )}
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[#182235]">Supporting attachment</h2>
            {application.attachment_name ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d9e1ec] bg-[#f8fafc] p-4">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#344054]">
                  <FileText className="h-5 w-5 text-[#667085]" />
                  {application.attachment_name}
                </span>
                <Button variant="outline" size="sm" disabled={downloading} onClick={download}>
                  <Download className="h-4 w-4" />
                  {downloading ? "Downloading…" : "Download"}
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#667085]">No attachment was provided.</p>
            )}
          </Card>
        </div>
        <StatusTimeline transitions={application.transitions} />
      </div>
      <Modal
        open={Boolean(dialog)}
        onClose={() => !transition.isPending && setDialog(null)}
        title={dialog?.title ?? "Update application"}
        description={dialog?.description}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              disabled={transition.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={dialog?.danger ? "danger" : "primary"}
              onClick={completeTransition}
              disabled={transition.isPending}
            >
              {transition.isPending ? "Updating…" : dialog?.confirmLabel}
            </Button>
          </>
        }
      >
        {dialog?.commentRequired && (
          <div>
            <Label htmlFor="transition-comment">Comment</Label>
            <Textarea
              id="transition-comment"
              autoFocus
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setDialogError(null);
              }}
              placeholder="Explain the decision to the applicant…"
            />
            {dialogError && (
              <p className="mt-2 text-xs font-medium text-[#b42318]">{dialogError}</p>
            )}
          </div>
        )}
        {!dialog?.commentRequired && dialogError && <Alert>{dialogError}</Alert>}
      </Modal>
      <Modal
        open={deleteOpen}
        onClose={() => !remove.isPending && setDeleteOpen(false)}
        title="Delete this draft?"
        description="This permanently removes the application and cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteApplication} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete draft"}
            </Button>
          </>
        }
      >
        {dialogError && <Alert>{dialogError}</Alert>}
      </Modal>
    </PageContainer>
  );
}
