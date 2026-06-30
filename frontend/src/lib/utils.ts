import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function parsePositiveInteger(value: string | null | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function searchParamsWithUpdates(
  current: URLSearchParams,
  updates: Record<string, string | number | null | undefined>,
  { resetPage = false }: { resetPage?: boolean } = {},
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (resetPage && !("page" in updates)) next.set("page", "1");
  return next;
}
