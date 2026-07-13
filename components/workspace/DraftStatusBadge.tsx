import type { WorkspaceDraftStatus } from "@/lib/types";

interface Props {
  status: WorkspaceDraftStatus;
  size?: "sm" | "md";
}

const config: Record<WorkspaceDraftStatus, { label: string; classes: string }> = {
  draft:            { label: "Draft",            classes: "bg-gray-100 text-gray-600" },
  pending_approval: { label: "Pending Approval", classes: "bg-yellow-100 text-yellow-700" },
  approved:         { label: "Approved",         classes: "bg-green-100 text-green-700" },
  rejected:         { label: "Rejected",         classes: "bg-red-100 text-red-700" },
  scheduled:        { label: "Scheduled",        classes: "bg-blue-100 text-blue-700" },
  published:        { label: "Published",        classes: "bg-purple-100 text-purple-700" },
  failed:           { label: "Publish Failed",   classes: "bg-red-100 text-red-700" },
};

export default function DraftStatusBadge({ status, size = "md" }: Props) {
  const { label, classes } = config[status] ?? config.draft;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${classes}`}>
      {label}
    </span>
  );
}