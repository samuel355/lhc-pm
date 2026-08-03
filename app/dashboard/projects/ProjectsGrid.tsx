"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DBProject } from "@/lib/types/db";
import { ProjectCard } from "@/components/projects/project-card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, SearchIcon } from "lucide-react";

export function ProjectsGrid({ projects }: { projects: DBProject[] }) {
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.departments?.name?.toLowerCase().includes(query)
    );
  }, [projects, search]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={PlusIcon}
        title="No Projects Yet"
        description="Projects will appear here once they are created by department heads."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects or departments..."
          className="pl-9"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No projects match your search"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project, index) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <ProjectCard
                style={{ animationDelay: `${index * 100}ms` }}
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  start_date: project.start_date,
                  end_date: project.end_date,
                  departmentName: project.departments?.name,
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
