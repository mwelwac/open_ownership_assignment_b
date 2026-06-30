import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, FieldError, Input, Label } from "@/components/ui";
import { authApi } from "@/features/auth/api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import {
  RegistrationFields,
  registrationSchema,
  type RegistrationValues,
} from "@/features/auth/components/RegistrationFields";
import { useLogin, useMe, useRegister, useRegisterReviewer } from "@/features/auth/hooks";
import { applyApiError } from "@/lib/forms";
import { safeRedirectPath } from "@/lib/utils";

export { ForgotPasswordPage, ResetPasswordPage } from "@/features/auth/PasswordPages";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function LoginFormPage({
  title,
  description,
  footer,
  brandLabel,
}: {
  title: string;
  description: string;
  footer: ReactNode;
  brandLabel?: string;
}) {
  const { data: user, isPending: authPending } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect =
    safeRedirectPath((location.state as { from?: string } | null)?.from) ??
    safeRedirectPath(new URLSearchParams(location.search).get("next")) ??
    "/applications";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    void authApi.csrf();
  }, []);
  if (!authPending && user) return <Navigate to={redirect} replace />;

  const submit = async (values: LoginValues) => {
    try {
      await login.mutateAsync(values);
      navigate(redirect, { replace: true });
    } catch (error) {
      applyApiError(error, setError, "Sign in failed. Check your connection and try again.");
    }
  };

  return (
    <AuthShell title={title} description={description} footer={footer} brandLabel={brandLabel}>
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              className="mb-1.5 text-xs font-semibold text-[#173a70] hover:underline"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export function LoginPage() {
  return (
    <LoginFormPage
      title="Applicant Portal"
      description="Sign in to manage your applications."
      footer={
        <div className="space-y-2">
          <p>
            New to the portal?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/register">
              Create an applicant account
            </Link>
          </p>
          <p>
            Reviewing applications?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/reviewer/login">
              Go to Reviewer Portal
            </Link>
          </p>
        </div>
      }
    />
  );
}

export function ReviewerLoginPage() {
  return (
    <LoginFormPage
      title="Reviewer Portal"
      description="Sign in to review submitted applications."
      brandLabel="CaseMan"
      footer={
        <div className="space-y-2">
          <p>
            Need reviewer access?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/reviewer/register">
              Create reviewer account
            </Link>
          </p>
          <p>
            Applying instead?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/login">
              Applicant sign in
            </Link>
          </p>
        </div>
      }
    />
  );
}

export function RegisterPage() {
  const mutation = useRegister();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({ resolver: zodResolver(registrationSchema) });
  useEffect(() => {
    void authApi.csrf();
  }, []);
  const submit = async (values: RegistrationValues) => {
    try {
      await mutation.mutateAsync(values);
      navigate("/applications", { replace: true });
    } catch (error) {
      applyApiError(error, setError, "We could not create your account.");
    }
  };
  return (
    <AuthShell
      title="Applicant Portal"
      description="Create an applicant account to start a new application."
      footer={
        <div className="space-y-2">
          <p>
            Already registered?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/login">
              Sign in
            </Link>
          </p>
          <p>
            Are you a reviewer?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/reviewer/register">
              Create reviewer account
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
        <RegistrationFields register={register} errors={errors} />
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}

export function ReviewerRegisterPage() {
  const mutation = useRegisterReviewer();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({ resolver: zodResolver(registrationSchema) });
  useEffect(() => {
    void authApi.csrf();
  }, []);
  const submit = async (values: RegistrationValues) => {
    try {
      await mutation.mutateAsync(values);
      navigate("/applications", { replace: true });
    } catch (error) {
      applyApiError(error, setError, "We could not create your reviewer account.");
    }
  };
  return (
    <AuthShell
      title="Reviewer Portal"
      description="Create a reviewer account to assess submitted applications."
      brandLabel="CaseMan"
      footer={
        <div className="space-y-2">
          <p>
            Already registered?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/reviewer/login">
              Reviewer sign in
            </Link>
          </p>
          <p>
            Applying instead?{" "}
            <Link className="font-semibold text-[#173a70] hover:underline" to="/register">
              Create applicant account
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        {errors.root?.serverError?.message && <Alert>{errors.root.serverError.message}</Alert>}
        <RegistrationFields register={register} errors={errors} idPrefix="reviewer_register" />
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating reviewer account…" : "Create reviewer account"}
        </Button>
      </form>
    </AuthShell>
  );
}
