"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2Icon, CalendarIcon, FolderKanbanIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentCardData {
  id: string;
  name: string;
  created_at: string;
  projectCount?: number;
}

interface DepartmentCardProps {
  department: DepartmentCardData;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ACCENT_TIERS = [
  { accent: "bg-primary", icon: "bg-primary/10 text-primary group-hover:bg-primary/20", chip: "text-primary" },
  { accent: "bg-chart-2", icon: "bg-chart-2/10 text-chart-2 group-hover:bg-chart-2/20", chip: "text-chart-2" },
  { accent: "bg-chart-3", icon: "bg-chart-3/10 text-chart-3 group-hover:bg-chart-3/20", chip: "text-chart-3" },
  { accent: "bg-chart-4", icon: "bg-chart-4/10 text-chart-4 group-hover:bg-chart-4/20", chip: "text-chart-4" },
  { accent: "bg-chart-5", icon: "bg-chart-5/10 text-chart-5 group-hover:bg-chart-5/20", chip: "text-chart-5" },
];

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ACCENT_TIERS[hash % ACCENT_TIERS.length];
}

export function DepartmentCard({ department, onClick, onEdit, onDelete, className, style }: DepartmentCardProps) {
  const tier = accentFor(department.id);
  const createdLabel = new Date(department.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "glass-card group relative flex overflow-hidden rounded-xl border border-border/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className={cn("w-1 shrink-0 transition-colors duration-300", tier.accent)} />

      <div className="flex-1 p-5">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-300", tier.icon)}>
            <Building2Icon className="h-4 w-4" />
          </div>
          <h3 className="truncate font-semibold text-base transition-colors duration-300 group-hover:text-primary">
            {department.name}
          </h3>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {createdLabel}
          </Badge>
          <Badge variant="outline" className={cn("gap-1 font-normal", tier.chip)}>
            <FolderKanbanIcon className="h-3 w-3" />
            {department.projectCount ?? 0} {department.projectCount === 1 ? "Project" : "Projects"}
          </Badge>
        </div>

        {(onEdit || onDelete) && (
          <div className="mt-4 flex items-center justify-end gap-1 border-t border-border/50 pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-chart-2/10 hover:text-chart-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
