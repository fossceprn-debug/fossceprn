import React from "react";
import { Users, BookOpen, Terminal, GitPullRequest, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PillarItem {
  label: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export const Highlights: React.FC = () => {
  const pillars: PillarItem[] = [
    {
      label: "Software Freedom",
      badge: "Core Ethos",
      title: "100% Free & Open",
      description: "Dedicated to open-source software, transparent collaboration, and shared digital commons.",
      icon: Sparkles,
    },
    {
      label: "Zero Barriers",
      badge: "Inclusive",
      title: "Open to All Branches",
      description: "Students from any department and year at CE Perumon can join without prerequisites.",
      icon: Users,
    },
    {
      label: "Hands-on Focus",
      badge: "Practical",
      title: "Workshops & Labs",
      description: "Peer-led bootcamps on Linux systems, Git workflows, web tech, and programming languages.",
      icon: Terminal,
    },
    {
      label: "Real Impact",
      badge: "Upstream",
      title: "Upstream Contributions",
      description: "Mentoring students to make their very first pull requests to national and global FOSS projects.",
      icon: GitPullRequest,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
              Our Foundations
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foss-black tracking-tight">
              Community Pillars
            </h2>
            <p className="text-sm text-foss-gray mt-1">
              Guiding principles behind the FOSS United Chapter at College of Engineering Perumon.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={idx}
                className="bg-white border-border hover:border-foss-green transition-all duration-300"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-foss-greenLight flex items-center justify-center text-foss-green">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] text-foss-gray">
                      {pillar.badge}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-foss-black tracking-tight">
                      {pillar.title}
                    </div>
                    <div className="text-xs font-semibold text-foss-green mt-0.5">
                      {pillar.label}
                    </div>
                    <p className="text-xs text-foss-gray mt-2 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
