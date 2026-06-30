import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reviewersApi, type ReviewerCreatePayload } from "@/features/reviewers/api";

const reviewerKeys = {
  all: ["reviewers"] as const,
  list: (page: number, pageSize: number) => [...reviewerKeys.all, page, pageSize] as const,
};

export function useReviewers(page: number, pageSize: number) {
  return useQuery({
    queryKey: reviewerKeys.list(page, pageSize),
    queryFn: () => reviewersApi.list(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReviewer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewerCreatePayload) => reviewersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewerKeys.all }),
  });
}
