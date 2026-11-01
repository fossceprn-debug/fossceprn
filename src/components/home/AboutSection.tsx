import React from "react";
import { BookOpen, Hammer, GitFork, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const AboutSection: React.FC = () => {
  const features = [
    {
      title: "Learn Together",
      description:
        "Explore new technologies, programming languages and development tools in peer learning sessions, deep-dive workshops, and tech talks.",
      icon: BookOpen,
      badgeText: "Skill Building",
      points: [
        "Hands-on Linux & Git bootcamps",
        "Modern web & cloud architectures",
        "Free software fundamentals",
      ],
    },
    {
      title: "Build Together",
      description:
        "Work on real-world projects and collaborate with fellow developers across batches, solving campus and community challenges.",
      icon: Hammer,
      badgeText: "Collaborative Labs",
      points: [
        "Campus utilities & open tooling",
        "Mentorship from senior developers",
        "Hackathons & project sprints",
      ],
    },
    {
      title: "Contribute Together",
      description:
        "Participate in open-source projects and become part of the global FOSS ecosystem through upstream PRs, documentation, and events.",
      icon: GitFork,
      badgeText: "Upstream Impact",
      points: [
        "Guided first Pull Requests",
        "Hacktoberfest & FOSS United grants",
        "Global community recognition",
      ],
    },
  ];

  return (
    <section id="about" className="py-20 bg-foss-lightBg/60 border-y border-border/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            About Our Chapter
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
            More Than Code. <span className="text-foss-green">A Community.</span>
          </h2>
          <p className="text-base sm:text-lg text-foss-gray leading-relaxed text-balance">
            FOSS CEPrn is a student-led open-source community at College of
            Engineering Perumon. We encourage students to learn, build, share
            knowledge and contribute to meaningful open-source projects.
          </p>
        </div>

        {/* 3 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="group relative overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-foss-green transition-colors" />
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-foss-greenLight flex items-center justify-center text-foss-green group-hover:bg-foss-green group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-foss-gray bg-foss-lightBg px-2.5 py-1 rounded-md border border-border">
                      {feature.badgeText}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foss-black group-hover:text-foss-green transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-foss-gray leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-3 border-t border-border text-xs text-foss-black">
                    {feature.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-2 text-foss-gray">
                        <CheckCircle2 className="w-4 h-4 text-foss-green shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
