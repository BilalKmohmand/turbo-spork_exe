import { Badge } from "@/components/ui/badge";

type StatusType = "pending" | "ai_graded" | "teacher_reviewed";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  ai_graded: { label: "AI Graded", variant: "outline" },
  teacher_reviewed: { label: "Reviewed", variant: "default" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] ?? { label: status, variant: "secondary" as const };

  return (
    <Badge
      variant={config.variant}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
