import { type AccountStatus, type UserRole } from "@prisma/client";

interface SerializableUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string | null;
  branchId?: string | null;
  branch?: { name: string } | null;
}

export function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function serializeUser(user: SerializableUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar: user.avatar ?? buildInitials(user.name),
    branchId: user.branchId ?? null,
    branchName: user.branch?.name ?? null,
  };
}
