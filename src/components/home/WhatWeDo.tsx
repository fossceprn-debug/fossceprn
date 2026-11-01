import React from "react";
import { Laptop, GitMerge, Trophy, Code, Users2, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const WhatWeDo: React.FC = () => {
  const activities = [
    {
      title: "Technical Workshops",
      description:
        "Practical, beginner-friendly to advanced masterclasses on Linux systems, Git/GitHub, Docker, Rust, Python, and web frameworks.",
      icon: Laptop,
    },
    {
      title: "Open Source Contributions",
      description:
        "Structured mentorship guiding members to make their first upstream Pull Requests to celebrated open-source software libraries.",
      icon: GitMerge,
    },
    {
      title: "Hackathons",
      description:
        "High-energy 24-48 hour coding marathons challenging teams to design and build open-source tools solving real problems.",
      icon: Trophy,
    },
    {
      title: "Coding Sessions",
      description:
        "Weekly collaborative problem-solving, code reviews, algorithm discussions, and pair programming weekends.",
      icon: Code,
    },
    {
      title: "Community Meetups",
      description:
        "Regular informal gatherings where students network, share projects, listen to lightning talks, and exchange ideas.",
      icon: Users2,
    },
    {
      title: "Project Development",
      description:
        "Long-term student teams building production-grade software for our campus and contributing to public digital public goods.",
      icon: Rocket,
    },
  ];

  return (
    <section className="py-20 bg-foss-lightBg/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            Our Initiatives
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
            What We Do
          </h2>
          <p className="text-base text-foss-gray">
            Fostering an authentic engineering culture through active hands-on activities,
            open knowledge sharing, and peer camaraderie.
          </p>
        </div>

        {/* 6 Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="group bg-white border-border hover:border-foss-green transition-all duration-300"
              >
                <CardContent className="p-7 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-foss-greenLight flex items-center justify-center text-foss-green group-hover:bg-foss-green group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foss-black group-hover:text-foss-green transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foss-gray leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
