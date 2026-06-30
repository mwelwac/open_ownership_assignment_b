import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { PageContainer, PageHeader } from "@/components/patterns";
import {
  Alert,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  useApplication,
  useCreateApplication,
  useUpdateApplication,
} from "@/features/applications/hooks";
import {
  CATEGORY_OPTIONS,
  validateAttachment,
  type ApplicationCategory,
} from "@/features/applications/model";
import { useMe } from "@/features/auth/hooks";
import { applyApiError } from "@/lib/forms";

const applicationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Use 255 characters or fewer"),
  category: z.enum(["NAME_CLEARANCE", "INCORPORATION", "BO_DECLARATION", "DETAILS_UPDATE"]),
  description: z.string(),
  amount: z
    .string()
    .refine(
      (value) => value === "" || /^-?\d{1,10}(\.\d{1,2})?$/.test(value),
      "Enter a number with no more than two decimal places",
    ),
});
type ApplicationValues = z.infer<typeof applicationSchema>;

export function ApplicationFormPage() {
  const { id } = useParams();
  const applicationId = Number(id);
  const editing = Number.isInteger(applicationId) && applicationId > 0;
  const detail = useApplication(applicationId);
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication(applicationId);
  const { data: user } = useMe();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { title: "", category: "INCORPORATION", description: "", amount: "" },
  });

  useEffect(() => {
    if (!detail.data) return;
    reset({
      title: detail.data.title,
      category: detail.data.category,
      description: detail.data.description,
      amount: detail.data.amount ?? "",
    });
  }, [detail.data, reset]);

  if (user?.role !== "APPLICANT") return <Navigate to="/applications" replace />;
  if (editing && detail.isPending)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading application…" />
      </div>
    );
  if (editing && (detail.isError || !detail.data))
    return (
      <PageContainer narrow>
        <Alert>That application could not be loaded.</Alert>
      </PageContainer>
    );
  if (
    editing &&
    detail.data &&
    (detail.data.owner.id !== user.id || detail.data.status !== "DRAFT")
  )
    return <Navigate to={`/applications/${applicationId}`} replace />;

  const submit = async (values: ApplicationValues) => {
    if (fileError) return;
    const payload = {
      ...values,
      category: values.category as ApplicationCategory,
      amount: values.amount || null,
      attachment: file ?? (removeExisting ? null : undefined),
    };
    try {
      const application = editing
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      navigate(`/applications/${application.id}`, { replace: true });
    } catch (error) {
      applyApiError(
        error,
        setError,
        `We could not ${editing ? "update" : "create"} the application.`,
      );
    }
  };

  const chooseFile = (selected?: File) => {
    setFileError(null);
    if (!selected) {
      setFile(undefined);
      return;
    }
    const validation = validateAttachment(selected);
    if (validation) {
      setFileError(validation);
      setFile(undefined);
      return;
    }
    setFile(selected);
    setRemoveExisting(false);
  };

  const serverError = errors.root?.serverError?.message;
  const attachmentServerError = (errors as Record<string, { message?: string }>).attachment
    ?.message;
  return (
    <PageContainer narrow>
      <PageHeader
        title={editing ? "Edit application" : "New application"}
        description={
          editing
            ? "Update this draft before submitting it for review."
            : "Complete the details below. Your application will be saved as a draft."
        }
        backTo={{
          to: editing ? `/applications/${applicationId}` : "/applications",
          label: editing ? "Back to application" : "Back to applications",
        }}
      />
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {serverError && <Alert>{serverError}</Alert>}
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <Label htmlFor="title">Application title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="A clear, descriptive title"
              {...register("title")}
            />
            <FieldError>{errors.title?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  id="category"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FieldError>{errors.category?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="description">
              Description <span className="font-normal text-[#98a2b3]">(optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={6}
              placeholder="Add any information the reviewer should know…"
              {...register("description")}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="amount">
              Amount <span className="font-normal text-[#98a2b3]">(optional)</span>
            </Label>
            <Input id="amount" inputMode="decimal" placeholder="0.00" {...register("amount")} />
            <FieldError>{errors.amount?.message}</FieldError>
            <p className="mt-1.5 text-xs text-[#7b879a]">
              No currency is assigned by the current application form.
            </p>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#eef3fa] p-2 text-[#173a70]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[#182235]">Supporting attachment</h2>
              <p className="mt-0.5 text-xs text-[#667085]">
                Optional PDF, JPEG, or PNG, up to 10 MB.
              </p>
            </div>
          </div>
          {editing && detail.data?.attachment_name && !removeExisting && !file && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d9e1ec] bg-[#f8fafc] p-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#344054]">
                <FileText className="h-4 w-4 text-[#667085]" />
                {detail.data.attachment_name}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setRemoveExisting(true)}>
                Remove
              </Button>
            </div>
          )}
          {removeExisting && (
            <Alert variant="info">
              The existing attachment will be removed when you save.{" "}
              <button
                className="font-semibold underline"
                type="button"
                onClick={() => setRemoveExisting(false)}
              >
                Undo
              </button>
            </Alert>
          )}
          <div className="mt-4">
            <Label htmlFor="attachment">
              {file
                ? "Replace selected file"
                : editing && detail.data?.attachment_name && !removeExisting
                  ? "Replace attachment"
                  : "Choose attachment"}
            </Label>
            <Input
              className="h-auto cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#eef3fa] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#173a70]"
              id="attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {file && (
              <p className="mt-2 text-xs font-medium text-[#067647]">Selected: {file.name}</p>
            )}
            <FieldError>{fileError ?? attachmentServerError}</FieldError>
          </div>
        </Card>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(editing ? `/applications/${applicationId}` : "/applications")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || Boolean(fileError)}>
            {isSubmitting ? "Saving…" : editing ? "Save changes" : "Save draft"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
