"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  BuildingIcon,
  FolderIcon,
  ListChecksIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardData {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  departmentName?: string | null;
}

interface ProjectCardProps {
  project: ProjectCardData;
  /** 0-100. Omit entirely when task data isn't available (renders no progress ring). */
  progress?: number;
  taskCounts?: { total: number; completed: number };
  /** Whole-card click handler. Omit when the card is already wrapped in a Link. */
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function progressTier(progress: number) {
  if (progress >= 100) return { ring: "stroke-chart-3", accent: "bg-chart-3", text: "text-chart-3" };
  if (progress >= 75) return { ring: "stroke-chart-2", accent: "bg-chart-2", text: "text-chart-2" };
  if (progress >= 50) return { ring: "stroke-chart-4", accent: "bg-chart-4", text: "text-chart-4" };
  if (progress > 0) return { ring: "stroke-chart-5", accent: "bg-chart-5", text: "text-chart-5" };
  return { ring: "stroke-muted-foreground/40", accent: "bg-muted-foreground/30", text: "text-muted-foreground" };
}

function ProgressRing({ progress }: { progress: number }) {
  const size = 44;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const tier = progressTier(progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-muted/40" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", tier.ring)}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">
        {Math.round(progress)}%
      </div>
    </div>
  );
}

export function ProjectCard({
  project,
  progress,
  taskCounts,
  onClick,
  onEdit,
  onDelete,
  className,
  style,
}: ProjectCardProps) {
  const description = project.description || "No description provided.";
  const truncatedDescription = description.length > 110 ? `${description.slice(0, 110)}...` : description;
  const startDate = formatDate(project.start_date);
  const endDate = formatDate(project.end_date);
  const isOverdue = project.end_date && new Date(project.end_date) < new Date() && (progress ?? 0) < 100;
  const tier = progressTier(progress ?? 0);

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
      <div className={cn("w-1 shrink-0 transition-colors duration-300", progress !== undefined ? tier.accent : "bg-primary/30")} />

      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <FolderIcon className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="truncate font-semibold text-base transition-colors duration-300 group-hover:text-primary">
                {project.name}
              </h3>
            </div>
            {project.departmentName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BuildingIcon className="h-3 w-3" />
                <span className="truncate">{project.departmentName}</span>
              </div>
            )}
          </div>
          {progress !== undefined && <ProgressRing progress={progress} />}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {truncatedDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(startDate || endDate) && (
            <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              {startDate || "No start"} – {endDate || "Ongoing"}
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="font-normal">
              Overdue
            </Badge>
          )}
          {taskCounts && (
            <Badge variant="outline" className={cn("gap-1 font-normal", tier.text)}>
              <ListChecksIcon className="h-3 w-3" />
              {taskCounts.completed}/{taskCounts.total} tasks
            </Badge>
          )}
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
