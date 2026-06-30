import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applicationsApi,
  type ApplicationFormPayload,
  type ApplicationListParams,
} from "@/features/applications/api";
import type { ApplicationStatus } from "@/features/applications/model";

const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: ApplicationListParams) => [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: number) => [...applicationKeys.details(), id] as const,
};

export function useApplications(params: ApplicationListParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useApplication(id: number) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

function useRefreshApplications() {
  const client = useQueryClient();
  return async (id?: number) => {
    await client.invalidateQueries({ queryKey: applicationKeys.lists() });
    if (id) await client.invalidateQueries({ queryKey: applicationKeys.detail(id) });
  };
}

export function useCreateApplication() {
  const refresh = useRefreshApplications();
  return useMutation({
    mutationFn: (payload: ApplicationFormPayload) => applicationsApi.create(payload),
    onSuccess: (application) => refresh(application.id),
  });
}

export function useUpdateApplication(id: number) {
  const refresh = useRefreshApplications();
  return useMutation({
    mutationFn: (payload: ApplicationFormPayload) => applicationsApi.update(id, payload),
    onSuccess: () => refresh(id),
  });
}

export function useDeleteApplication() {
  const refresh = useRefreshApplications();
  return useMutation({
    mutationFn: (id: number) => applicationsApi.remove(id),
    onSuccess: () => refresh(),
  });
}

export function useTransitionApplication(id: number) {
  const refresh = useRefreshApplications();
  return useMutation({
    mutationFn: ({ status, comment }: { status: ApplicationStatus; comment?: string }) =>
      applicationsApi.transition(id, status, comment),
    onSuccess: () => refresh(id),
  });
}
