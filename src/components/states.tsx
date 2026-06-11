import * as React from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EncomendaStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-linha bg-white/60 px-6 py-10 text-center">
      <div className="text-terracota/70">
        {icon ?? <PackageOpen className="h-10 w-10" strokeWidth={1.5} />}
      </div>
      <p className="font-serif text-lg text-tinta">{title}</p>
      {description && (
        <p className="text-sm text-tinta/60">{description}</p>
      )}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-tinta/8", className)} />
  );
}

export function StatusBadge({ status }: { status: EncomendaStatus }) {
  const map = {
    registrada: { label: "Registrada", variant: "dourado" as const },
    retirada: { label: "Retirada", variant: "verde" as const },
    contestada: { label: "Contestada", variant: "terracota" as const },
  };
  const s = map[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
