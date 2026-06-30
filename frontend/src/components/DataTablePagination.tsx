import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button, Select } from "@/components/ui";

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = "applications",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  itemLabel?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const first = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9f0] px-4 py-3 text-xs text-[#667085]">
      <span>
        {first}–{last} of {total} {itemLabel}
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <Select
            aria-label="Rows per page"
            className="h-8 w-20 text-xs"
            value={pageSize}
            disabled={disabled}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </Select>
        </label>
        <span>
          Page {currentPage} of {pageCount}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={disabled || currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
