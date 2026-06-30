import { ArrowDownUp, FilePlus2, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DataTablePagination } from "@/components/DataTablePagination";
import { PageContainer, PageHeader } from "@/components/patterns";
import { Alert, Button, Card, Input, Select, Spinner } from "@/components/ui";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { useApplications } from "@/features/applications/hooks";
import {
  CATEGORY_OPTIONS,
  isChangesRequested,
  STATUS_OPTIONS,
  type ApplicationCategory,
  type ApplicationStatus,
} from "@/features/applications/model";
import { useMe } from "@/features/auth/hooks";
import { formatAmount, formatDate } from "@/lib/format";
import { parsePositiveInteger, searchParamsWithUpdates } from "@/lib/utils";

export function ApplicationsPage() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const isReviewer = user?.role === "REVIEWER";
  const reviewerView = searchParams.get("view") ?? "submitted";
  const status = isReviewer
    ? reviewerView === "submitted"
      ? "SUBMITTED"
      : reviewerView === "under-review"
        ? "UNDER_REVIEW"
        : undefined
    : ((searchParams.get("status") as ApplicationStatus | null) ?? undefined);
  const params = {
    page: parsePositiveInteger(searchParams.get("page"), 1),
    pageSize: Math.min(100, parsePositiveInteger(searchParams.get("page_size"), 20)),
    search: searchParams.get("search") || undefined,
    status: status as ApplicationStatus | undefined,
    category: (searchParams.get("category") as ApplicationCategory | null) ?? undefined,
    ordering: searchParams.get("ordering") || "-created_at",
  };
  const query = useApplications(params);

  const update = (updates: Record<string, string | null>) => {
    setSearchParams(searchParamsWithUpdates(searchParams, updates, { resetPage: true }));
  };

  return (
    <PageContainer>
      <PageHeader
        title={isReviewer ? "Review queue" : "My applications"}
        description={
          isReviewer
            ? "Review submitted applications and track decisions in progress."
            : "Create, submit, and track your service applications."
        }
        actions={
          !isReviewer && (
            <Button onClick={() => navigate("/applications/new")}>
              <FilePlus2 className="h-4 w-4" />
              New application
            </Button>
          )
        }
      />

      {isReviewer && (
        <div
          className="mb-4 flex w-fit gap-1 rounded-lg border border-[#d8e0eb] bg-white p-1"
          role="tablist"
          aria-label="Review queue views"
        >
          {[
            ["submitted", "Submitted"],
            ["under-review", "Under review"],
            ["all", "All applications"],
          ].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={reviewerView === value}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${reviewerView === value ? "bg-[#102a56] text-white" : "text-[#526078] hover:bg-[#f2f4f7]"}`}
              onClick={() => update({ view: value })}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e4e9f0] p-4">
          <form
            className="flex min-w-[240px] flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              update({ search: searchDraft.trim() || null });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-5 w-5 text-[#98a2b3]" />
              <Input
                aria-label="Search applications"
                className="pl-10"
                placeholder={
                  isReviewer
                    ? "Search title, description, or applicant…"
                    : "Search your applications…"
                }
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">
              Search
            </Button>
          </form>
          <Select
            aria-label="Filter by category"
            className="w-full sm:w-52"
            value={params.category ?? ""}
            onChange={(event) => update({ category: event.target.value || null })}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {!isReviewer && (
            <Select
              aria-label="Filter by status"
              className="w-full sm:w-44"
              value={params.status ?? ""}
              onChange={(event) => update({ status: event.target.value || null })}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          <label className="flex w-full items-center gap-2 sm:w-auto">
            <ArrowDownUp className="h-4 w-4 text-[#667085]" />
            <Select
              aria-label="Order applications"
              className="w-full sm:w-44"
              value={params.ordering}
              onChange={(event) => update({ ordering: event.target.value })}
            >
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="title">Title A–Z</option>
              <option value="-updated_at">Recently updated</option>
              <option value="-amount">Highest amount</option>
            </Select>
          </label>
        </div>

        {query.isError && (
          <div className="p-5">
            <Alert>Applications could not be loaded. Please refresh and try again.</Alert>
          </div>
        )}
        {query.isPending && (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner label="Loading applications…" />
          </div>
        )}
        {query.data && query.data.results.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3fa] text-[#173a70]">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-semibold text-[#182235]">No applications found</h2>
            <p className="mt-1 text-sm text-[#667085]">
              {params.search || params.status || params.category
                ? "Try changing your search or filters."
                : isReviewer
                  ? "There are no applications in this queue."
                  : "Create your first application to get started."}
            </p>
            {!isReviewer && !params.search && !params.status && !params.category && (
              <Button className="mt-5" onClick={() => navigate("/applications/new")}>
                New application
              </Button>
            )}
          </div>
        )}
        {query.data && query.data.results.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-[#f8fafc] text-xs tracking-wide text-[#667085] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Application</th>
                    {isReviewer && <th className="px-4 py-3 font-semibold">Applicant</th>}
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f4]">
                  {query.data.results.map((application) => (
                    <tr
                      key={application.id}
                      className="cursor-pointer hover:bg-[#f8fafc]"
                      onClick={() => navigate(`/applications/${application.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#182235]">{application.title}</div>
                        <div className="mt-1 text-xs text-[#667085]">
                          {CATEGORY_OPTIONS.find(([value]) => value === application.category)?.[1]}
                        </div>
                        {!isReviewer && isChangesRequested(application) && (
                          <div className="mt-2 text-xs font-semibold text-[#b54708]">
                            Reviewer feedback is ready — edit and resubmit.
                          </div>
                        )}
                      </td>
                      {isReviewer && (
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-[#344054]">
                            {application.owner.full_name}
                          </div>
                          <div className="text-xs text-[#667085]">{application.owner.email}</div>
                        </td>
                      )}
                      <td className="px-4 py-4 text-sm text-[#344054]">
                        {formatAmount(application.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <ApplicationStatusBadge application={application} />
                      </td>
                      <td className="px-4 py-4 text-sm text-[#667085]">
                        {formatDate(application.updated_at)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-[#173a70]">
                        View
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              page={params.page}
              pageSize={params.pageSize}
              total={query.data.count}
              disabled={query.isFetching}
              onPageChange={(page) => update({ page: String(page) })}
              onPageSizeChange={(pageSize) => update({ page_size: String(pageSize), page: "1" })}
            />
          </>
        )}
      </Card>
    </PageContainer>
  );
}
