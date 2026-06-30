import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, FieldError, Input, Label } from "@/components/ui";
import { authApi } from "@/features/auth/api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { applyApiError } from "@/lib/forms";

const emailSchema = z.object({ email: z.string().email("Enter a valid email address") });
type EmailValues = z.infer<typeof emailSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const mutation = useMutation({ mutationFn: authApi.requestReset });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });

  useEffect(() => {
    void authApi.csrf();
  }, []);

  const submit = async (values: EmailValues) => {
    try {
      await mutation.mutateAsync(values);
      setSent(true);
    } catch (error) {
      applyApiError(error, setError, "We could not process your request.");
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we’ll send reset instructions."
      footer={
        <Link className="font-semibold text-[#173a70] hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success">
          If an active account exists for that address, reset instructions have been sent.
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
          <div>
            <Label htmlFor="reset_email">Email address</Label>
            <Input
              id="reset_email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset instructions"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

const resetSchema = z
  .object({
    new_password: z.string().min(8, "Use at least 8 characters"),
    new_password_confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.new_password === value.new_password_confirm, {
    path: ["new_password_confirm"],
    message: "Passwords do not match",
  });
type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const { uid = "", token = "" } = useParams();
  const [complete, setComplete] = useState(false);
  const mutation = useMutation({
    mutationFn: (values: ResetValues) => authApi.confirmReset(uid, token, values),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  useEffect(() => {
    void authApi.csrf();
  }, []);

  const submit = async (values: ResetValues) => {
    try {
      await mutation.mutateAsync(values);
      setComplete(true);
    } catch (error) {
      applyApiError(error, setError, "The reset link may be invalid or expired.");
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      description="Use a strong password you haven’t used before."
      footer={
        <Link className="font-semibold text-[#173a70] hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      {complete ? (
        <div className="space-y-4">
          <Alert variant="success">Your password has been reset successfully.</Alert>
          <Link to="/login">
            <Button className="w-full">Continue to sign in</Button>
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
          <div>
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...register("new_password")}
            />
            <FieldError>{errors.new_password?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="new_password_confirm">Confirm new password</Label>
            <Input
              id="new_password_confirm"
              type="password"
              autoComplete="new-password"
              {...register("new_password_confirm")}
            />
            <FieldError>{errors.new_password_confirm?.message}</FieldError>
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
