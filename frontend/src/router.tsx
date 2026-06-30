import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StaffRoute } from "@/components/StaffRoute";
import { Spinner } from "@/components/ui";

function lazyNamed<TModule, TExport extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TExport,
) {
  return lazy(async () => ({
    default: (await loader())[exportName] as ComponentType,
  }));
}

const AccountPage = lazyNamed(() => import("@/features/auth/AccountPage"), "AccountPage");
const ApplicationDetailPage = lazyNamed(
  () => import("@/features/applications/ApplicationDetailPage"),
  "ApplicationDetailPage",
);
const ApplicationFormPage = lazyNamed(
  () => import("@/features/applications/ApplicationFormPage"),
  "ApplicationFormPage",
);
const ApplicationsPage = lazyNamed(
  () => import("@/features/applications/ApplicationsPage"),
  "ApplicationsPage",
);
const ForgotPasswordPage = lazyNamed(
  () => import("@/features/auth/PasswordPages"),
  "ForgotPasswordPage",
);
const LoginPage = lazyNamed(() => import("@/features/auth/AuthPages"), "LoginPage");
const RegisterPage = lazyNamed(() => import("@/features/auth/AuthPages"), "RegisterPage");
const ReviewerLoginPage = lazyNamed(
  () => import("@/features/auth/AuthPages"),
  "ReviewerLoginPage",
);
const ReviewerRegisterPage = lazyNamed(
  () => import("@/features/auth/AuthPages"),
  "ReviewerRegisterPage",
);
const ResetPasswordPage = lazyNamed(
  () => import("@/features/auth/PasswordPages"),
  "ResetPasswordPage",
);
const ReviewersPage = lazyNamed(() => import("@/features/reviewers/ReviewersPage"), "ReviewersPage");

function routeElement(children: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner label="Loading…" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    { path: "/login", element: routeElement(<LoginPage />) },
    { path: "/register", element: routeElement(<RegisterPage />) },
    { path: "/reviewer/login", element: routeElement(<ReviewerLoginPage />) },
    { path: "/reviewer/register", element: routeElement(<ReviewerRegisterPage />) },
    { path: "/forgot-password", element: routeElement(<ForgotPasswordPage />) },
    { path: "/reset-password/:uid/:token", element: routeElement(<ResetPasswordPage />) },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { index: true, element: <Navigate to="/applications" replace /> },
            { path: "/applications", element: routeElement(<ApplicationsPage />) },
            { path: "/applications/new", element: routeElement(<ApplicationFormPage />) },
            { path: "/applications/:id", element: routeElement(<ApplicationDetailPage />) },
            { path: "/applications/:id/edit", element: routeElement(<ApplicationFormPage />) },
            { path: "/account", element: routeElement(<AccountPage />) },
            {
              element: <StaffRoute />,
              children: [{ path: "/reviewers", element: routeElement(<ReviewersPage />) }],
            },
          ],
        },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  { future: { v7_relativeSplatPath: true } },
);
