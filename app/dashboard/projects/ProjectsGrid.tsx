"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DBProject } from "@/lib/types/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, CalendarIcon, BuildingIcon, SearchIcon } from "lucide-react";

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
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="group">
              <Card
                className="glass-card group-hover:shadow-2xl group-hover:shadow-chart-2/10 dark:group-hover:shadow-chart-2/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold group-hover:text-chart-2 transition-colors duration-300">
                        {project.name}
                      </CardTitle>
                      {project.departments && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BuildingIcon className="w-4 h-4" />
                          <span>{project.departments.name} Department</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 rounded-lg bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors duration-300">
                      <CalendarIcon className="w-5 h-5 text-chart-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString()
                        : "No start date"}
                      {" – "}
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {project.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
