import RoleBadge from "@/components/workspace/RoleBadge";
import type { WorkspaceMember } from "@/types";

interface Props {
  member: WorkspaceMember;
  showRole?: boolean;
  showEmail?: boolean;
}

export default function MemberAvatar({ member, showRole = true, showEmail = true }: Props) {
  const initials = member.full_name
    ? member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : member.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name || member.email}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
      )}

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {member.full_name || member.email}
        </p>
        {showEmail && member.full_name && (
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        )}
      </div>

      {/* Role badge */}
      {showRole && <RoleBadge role={member.role} size="sm" />}
    </div>
  );
}