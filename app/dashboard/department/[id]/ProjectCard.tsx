"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from "lucide-react";
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
    if (!dateStr) return 'Date Not set';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString();
  }

  return (
    <Card className="hover:shadow-md transition cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{project.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {truncatedDescription}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress.toFixed(0)}% Complete
            </Badge>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Start: {formatDate(project.start_date)}
            </span>
            <span>
              End: {formatDate(project.end_date)}
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
