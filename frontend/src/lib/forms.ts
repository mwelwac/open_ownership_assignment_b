import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/lib/api/client";

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallback: string,
): void {
  if (!(error instanceof ApiError)) {
    setError("root.serverError" as Path<T>, { type: "server", message: fallback });
    return;
  }
  const fields = error.fieldErrors;
  if (fields) {
    for (const [field, messages] of Object.entries(fields)) {
      setError(field as Path<T>, { type: "server", message: messages.join(" ") });
    }
  }
  setError("root.serverError" as Path<T>, { type: "server", message: error.detail || fallback });
}
