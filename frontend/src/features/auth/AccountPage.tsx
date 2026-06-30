import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { DetailItem, PageContainer, PageHeader } from "@/components/patterns";
import { Alert, Button, Card, FieldError, Input, Label } from "@/components/ui";
import { useChangePassword, useMe } from "@/features/auth/hooks";
import { applyApiError } from "@/lib/forms";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Use at least 8 characters"),
    new_password_confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.new_password === value.new_password_confirm, {
    path: ["new_password_confirm"],
    message: "Passwords do not match",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountPage() {
  const { data: user } = useMe();
  const mutation = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
  if (!user) return null;
  const submit = async (values: PasswordValues) => {
    try {
      await mutation.mutateAsync(values);
      reset();
      toast.success("Your password has been changed.");
    } catch (error) {
      applyApiError(error, setError, "Your password could not be changed.");
    }
  };
  return (
    <PageContainer narrow>
      <PageHeader
        title="Account"
        description="Review your account details and update your password."
      />
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[#eef3fa] p-2 text-[#173a70]">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#182235]">Profile</h2>
              <p className="text-xs text-[#667085]">
                Your account identity is managed by the portal.
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Full name">{user.full_name}</DetailItem>
            <DetailItem label="Email">{user.email}</DetailItem>
            <DetailItem label="Role">
              {user.role === "REVIEWER" ? "Reviewer" : "Applicant"}
            </DetailItem>
            <DetailItem label="Account ID">{user.uuid}</DetailItem>
          </dl>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[#fff4d6] p-2 text-[#7a4d00]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#182235]">Change password</h2>
              <p className="text-xs text-[#667085]">Your current session will remain active.</p>
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)} noValidate>
            {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
            <div>
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...register("current_password")}
              />
              <FieldError>{errors.current_password?.message}</FieldError>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="account_new_password">New password</Label>
                <Input
                  id="account_new_password"
                  type="password"
                  autoComplete="new-password"
                  {...register("new_password")}
                />
                <FieldError>{errors.new_password?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="account_new_password_confirm">Confirm new password</Label>
                <Input
                  id="account_new_password_confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register("new_password_confirm")}
                />
                <FieldError>{errors.new_password_confirm?.message}</FieldError>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Changing password…" : "Change password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
