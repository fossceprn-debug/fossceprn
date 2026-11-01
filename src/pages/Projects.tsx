import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Github,
  Search,
  ExternalLink,
  Code2,
  ArrowRight,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getPublishedProjects } from "@/lib/supabase";
import type { ProjectItem } from "@/types";

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("All");

  useEffect(() => {
    let isMounted = true;
    async function fetch() {
      try {
        const live = await getPublishedProjects();
        if (isMounted) {
          setProjects(live);
        }
      } catch {
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const allTechnologies = [
    "All",
    ...Array.from(new Set(projects.flatMap((p) => p.technologies || []))),
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchesTech =
      selectedTech === "All" || (p.technologies && p.technologies.includes(selectedTech));

    return matchesSearch && matchesTech;
  });

  return (
    <PageLayout>
      {/* Header Banner */}
      <section className="py-16 md:py-20 bg-foss-lightBg/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            Open Source Lab
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            Student <span className="text-foss-green">Projects</span>
          </h1>
          <p className="text-base sm:text-lg text-foss-gray max-w-2xl mx-auto leading-relaxed">
            Software built by students of College of Engineering Perumon to solve campus
            challenges and contribute to the digital commons.
          </p>
        </div>
      </section>

      {/* Main Grid Section */}
      <section className="py-16 bg-white min-h-[500px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-foss-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>

            {/* Tech filter pills */}
            {allTechnologies.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {allTechnologies.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => setSelectedTech(tech)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedTech === tech
                        ? "bg-foss-green text-white shadow-xs"
                        : "bg-foss-lightBg text-foss-black hover:bg-gray-100"
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-foss-lightBg animate-pulse border border-border"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-20 px-6 rounded-2xl bg-foss-lightBg/50 border border-border max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foss-black">
                {projects.length === 0 ? "No Projects Listed Yet" : "No Matching Projects"}
              </h3>
              <p className="text-sm text-foss-gray leading-relaxed">
                {projects.length === 0
                  ? "Student repositories and open source initiatives will be featured here as they are published."
                  : "No projects match your current search query or technology filter."}
              </p>
              {projects.length === 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button asChild size="sm">
                    <a
                      href="https://github.com/fossceprn"
                      target="_blank"
                      rel="noreferrer"
                      className="gap-1.5"
                    >
                      <Github className="w-4 h-4" />
                      <span>Visit GitHub Organization</span>
                    </a>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedTech("All");
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          )}

          {/* Grid */}
          {!loading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {project.cover_image ? (
                      <div className="relative h-48 w-full overflow-hidden bg-foss-lightBg">
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 p-1.5 rounded-lg border border-border shadow-xs">
                          <FolderGit2 className="w-4 h-4 text-foss-green" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-foss-lightBg flex items-center justify-center border-b border-border text-foss-green/50">
                        <Code2 className="w-10 h-10" />
                      </div>
                    )}

                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-bold text-foss-black group-hover:text-foss-green transition-colors leading-snug">
                        {project.title}
                      </h3>

                      <p className="text-xs text-foss-gray leading-relaxed line-clamp-3">
                        {project.description}
                      </p>

                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.technologies.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-foss-lightBg text-foss-black border border-border"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0 border-t border-border/60 flex items-center justify-between">
                    {project.github_url ? (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foss-black hover:text-foss-green transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                      </a>
                    ) : (
                      <span className="text-xs text-foss-gray">Community Repo</span>
                    )}

                    <span className="text-[11px] font-medium text-foss-green">
                      Open Source
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* How to contribute banner */}
          <div className="mt-16 p-8 rounded-2xl bg-foss-lightBg border border-border space-y-3">
            <h3 className="text-xl font-bold text-foss-black">
              Want to build an open-source project with FOSS CEPrn?
            </h3>
            <p className="text-sm text-foss-gray max-w-2xl leading-relaxed">
              We encourage students to collaborate on software utilities, college tools, and libraries.
              Have an idea or repository you want to maintain under the FOSS CEPrn umbrella?
            </p>
            <div className="pt-2">
              <Button asChild size="sm">
                <a
                  href="https://github.com/fossceprn"
                  target="_blank"
                  rel="noreferrer"
                  className="gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>Browse FOSS CEPrn GitHub Org</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default Projects;
