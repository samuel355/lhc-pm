"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash, CalendarIcon, FolderIcon, CheckCircleIcon } from "lucide-react";
import React from "react";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  department_id?: string | null;
  created_by?: string | null;
  tasks?: { status: string }[];
};

export default function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
  progress,
}: {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  progress: number;
}) {
  const description = project.description || "";
  const truncatedDescription =
    description.length > 100 ? `${description.slice(0, 100)}...` : description;

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "Date Not set";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString();
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-chart-3";
    if (progress >= 75) return "bg-chart-2";
    if (progress >= 50) return "bg-chart-4";
    return "bg-chart-5";
  };

  const getProgressBadgeColor = (progress: number) => {
    if (progress === 100) return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    if (progress >= 75) return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    if (progress >= 50) return "bg-chart-4/10 text-chart-4 border-chart-4/20";
    return "bg-chart-5/10 text-chart-5 border-chart-5/20";
  };

  return (
    <Card className="glass-card group hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="relative p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300 mb-2">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <FolderIcon className="w-4 h-4" />
              <span>Project</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getProgressBadgeColor(progress)} border`}>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                <span>{progress.toFixed(0)}% Complete</span>
              </div>
            </Badge>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {truncatedDescription}
          </p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Start: {formatDate(project.start_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>End: {formatDate(project.end_date)}</span>
            </div>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor(progress)} h-2 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="hover:bg-primary/10 hover:text-primary transition-colors duration-300"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="hover:bg-chart-2/10 hover:text-chart-2 transition-colors duration-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
