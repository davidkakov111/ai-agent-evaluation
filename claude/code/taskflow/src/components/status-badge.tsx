import { Badge } from "@/components/ui/badge";

const taskStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  TODO: { label: "To Do", variant: "outline" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  DONE: { label: "Done", variant: "secondary" },
};

const requestStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "default" },
  APPROVED: { label: "Approved", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OWNER: { label: "Owner", variant: "default" },
  ADMIN: { label: "Admin", variant: "secondary" },
  EMPLOYEE: { label: "Employee", variant: "outline" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const config = taskStatusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RequestStatusBadge({ status }: { status: string }) {
  const config = requestStatusConfig[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] ?? { label: role, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
