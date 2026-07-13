import { getRoleLabel, getRoleBadgeClass } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/types";

interface Props {
  role: WorkspaceRole;
  size?: "sm" | "md";
}

export default function RoleBadge({ role, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${getRoleBadgeClass(role)}`}>
      {getRoleLabel(role)}
    </span>
  );
}