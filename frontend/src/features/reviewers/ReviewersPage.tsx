import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { DataTablePagination } from "@/components/DataTablePagination";
import { PageContainer, PageHeader } from "@/components/patterns";
import { Alert, Button, Card, Modal, Spinner } from "@/components/ui";
import {
  RegistrationFields,
  registrationSchema,
  type RegistrationValues,
} from "@/features/auth/components/RegistrationFields";
import { useCreateReviewer, useReviewers } from "@/features/reviewers/hooks";
import { applyApiError } from "@/lib/forms";
import { parsePositiveInteger, searchParamsWithUpdates } from "@/lib/utils";

export function ReviewersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("page_size"), 20);
  const reviewers = useReviewers(page, pageSize);
  const createReviewer = useCreateReviewer();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirm: "",
    },
  });

  const closeDialog = () => {
    if (isSubmitting) return;
    setDialogOpen(false);
    reset();
  };

  const submit = async (values: RegistrationValues) => {
    try {
      const reviewer = await createReviewer.mutateAsync(values);
      toast.success(`${reviewer.full_name} can now sign in as a reviewer.`);
      setDialogOpen(false);
      reset();
    } catch (error) {
      applyApiError(error, setError, "We could not create the reviewer account.");
    }
  };

  const updatePage = (nextPage: number) => {
    setSearchParams(searchParamsWithUpdates(searchParams, { page: nextPage }));
  };

  const updatePageSize = (nextPageSize: number) => {
    setSearchParams(searchParamsWithUpdates(searchParams, { page: 1, page_size: nextPageSize }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Reviewers"
        description="Create and view the people who can assess submitted applications."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add reviewer
          </Button>
        }
      />

      {reviewers.isError ? (
        <Alert>We could not load reviewer accounts. Refresh the page to try again.</Alert>
      ) : (
        <Card className="overflow-hidden">
          {reviewers.isPending ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner label="Loading reviewers…" />
            </div>
          ) : reviewers.data.results.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4d6] text-[#9a6300]">
                <UserRoundCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-[#182235]">No reviewers yet</h2>
              <p className="mt-1 max-w-md text-sm text-[#667085]">
                Add the first reviewer so submitted applications can enter the review workflow.
              </p>
              <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add reviewer
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#e4e9f0] bg-[#f8fafc] text-xs font-semibold tracking-wide text-[#667085] uppercase">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf0f4]">
                    {reviewers.data.results.map((reviewer) => (
                      <tr key={reviewer.uuid}>
                        <td className="px-5 py-4 font-semibold text-[#27364d]">
                          {reviewer.full_name}
                        </td>
                        <td className="px-5 py-4 text-[#526078]">{reviewer.email}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#1849a9]">
                            Reviewer
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={reviewers.data.count}
                itemLabel="reviewers"
                disabled={reviewers.isFetching}
                onPageChange={updatePage}
                onPageSizeChange={updatePageSize}
              />
            </>
          )}
        </Card>
      )}

      <Modal
        open={dialogOpen}
        title="Add reviewer"
        description="Create credentials for a person who will review applications."
        onClose={closeDialog}
        footer={
          <>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="reviewer-form" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create reviewer"}
            </Button>
          </>
        }
      >
        <form id="reviewer-form" className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
          <RegistrationFields
            register={register}
            errors={errors}
            idPrefix="reviewer"
            passwordLabel="Temporary password"
            passwordConfirmLabel="Confirm temporary password"
          />
        </form>
      </Modal>
    </PageContainer>
  );
}
