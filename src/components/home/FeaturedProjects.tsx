import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Github, ArrowRight, FolderGit2, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublishedProjects } from "@/lib/supabase";
import type { ProjectItem } from "@/types";

export const FeaturedProjects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProjects() {
      try {
        const liveProjects = await getPublishedProjects();
        if (isMounted) {
          setProjects(liveProjects);
        }
      } catch (err) {
        console.error("Error fetching projects", err);
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="projects" className="py-20 bg-foss-lightBg/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
              Student Innovations
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
              Featured Projects
            </h2>
            <p className="text-base text-foss-gray mt-1">
              Open-source software built by our members to solve campus needs and contribute to the commons.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start sm:self-auto gap-2">
            <Link to="/projects">
              <span>Explore All Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-white border border-border space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foss-black">
              Student Projects in Development
            </h3>
            <p className="text-sm text-foss-gray leading-relaxed">
              Our community projects are currently being developed and will be listed here.
              Have a repository or an open-source idea to build together?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="sm">
                <Link to="/join">Submit or Join a Project</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://github.com/fossceprn"
                  target="_blank"
                  rel="noreferrer"
                  className="gap-1.5"
                >
                  <Github className="w-4 h-4" />
                  <span>Visit GitHub</span>
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.slice(0, 3).map((project) => (
              <Card
                key={project.id}
                className="group overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Project Image or Clean Icon Header */}
                  {project.cover_image ? (
                    <div className="relative h-44 w-full overflow-hidden bg-foss-lightBg border-b border-border/80">
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg border border-border shadow-xs">
                        <FolderGit2 className="w-4 h-4 text-foss-green" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-foss-lightBg flex items-center justify-center border-b border-border text-foss-green/50">
                      <Code2 className="w-10 h-10" />
                    </div>
                  )}

                  {/* Content */}
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foss-black group-hover:text-foss-green transition-colors leading-snug">
                      {project.title}
                    </h3>

                    <p className="text-sm text-foss-gray leading-relaxed line-clamp-3">
                      {project.description}
                    </p>

                    {/* Tech Badges */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-foss-lightBg text-foss-black border border-border"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 flex items-center justify-between border-t border-border/60 mt-4">
                  {project.github_url ? (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-foss-black hover:text-foss-green transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      <span>View Repository</span>
                    </a>
                  ) : (
                    <span className="text-xs text-foss-gray">Community Project</span>
                  )}

                  <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-foss-green">
                    <Link to="/projects">
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
