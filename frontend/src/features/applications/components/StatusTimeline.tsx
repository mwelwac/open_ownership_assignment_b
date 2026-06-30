import { Card } from "@/components/ui";
import { STATUS_LABELS, type StatusTransition } from "@/features/applications/model";
import { formatDateTime } from "@/lib/format";

export function StatusTimeline({ transitions }: { transitions: StatusTransition[] }) {
  return (
    <Card className="h-fit p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#182235]">Status history</h2>
      <p className="mt-1 text-sm text-[#667085]">A record of each workflow decision.</p>
      {transitions.length ? (
        <ol className="mt-6 space-y-5">
          {[...transitions].reverse().map((item, index) => (
            <li className="relative pl-7" key={item.id}>
              {index < transitions.length - 1 && (
                <span className="absolute top-5 left-[7px] h-[calc(100%+0.25rem)] w-px bg-[#d7dee8]" />
              )}
              <span className="absolute top-1 left-0 h-4 w-4 rounded-full border-4 border-[#d9e6fa] bg-[#173a70]" />
              <div className="text-sm font-semibold text-[#344054]">
                {STATUS_LABELS[item.to_status]}
              </div>
              <div className="mt-0.5 text-xs text-[#667085]">
                {item.actor.full_name} · {formatDateTime(item.created_at)}
              </div>
              {item.comment && (
                <p className="mt-2 rounded-md bg-[#f5f7fa] p-2.5 text-xs leading-5 text-[#526078]">
                  {item.comment}
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-6 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
          This application is still a draft and has no transitions yet.
        </div>
      )}
    </Card>
  );
}
