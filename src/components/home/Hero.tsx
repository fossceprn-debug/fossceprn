import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GitBranch, GitPullRequest, Terminal, Sparkles, Code2, Users, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-white">
      {/* Background Subtle Tech Patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Chapter Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foss-lightBg border border-border text-xs font-medium text-foss-black shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-foss-green animate-pulse" />
              <span className="font-semibold text-foss-green">FOSS UNITED</span>
              <span className="text-foss-gray">·</span>
              <span>Students Chapter · CEPrn</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foss-black leading-[1.08]">
              BUILD. <span className="text-foss-green">SHARE.</span>
              <br />
              CONTRIBUTE.
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-foss-gray font-normal leading-relaxed max-w-xl text-balance">
              A community of curious minds building together through open-source
              technology, collaboration and innovation at College of Engineering
              Perumon.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="rounded-xl shadow-sm gap-2">
                <Link to="/about">
                  <span>Explore Our Community</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl border-border hover:border-foss-green hover:bg-foss-lightBg gap-2"
              >
                <Link to="/join">
                  <HeartHandshake className="w-4 h-4 text-foss-green" />
                  <span>Join FOSS CEPrn</span>
                </Link>
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 border-t border-border/80 flex flex-wrap items-center gap-6 text-xs text-foss-gray">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-foss-green" />
                <span>100% Student-Led</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-foss-green" />
                <span>Open Source Philosophy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-foss-green" />
                <span>All Tech Stacks Welcome</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column (Developer / GitHub Inspired Mockup) */}
          <div className="lg:col-span-5 relative">
            {/* Floating Badges */}
            <div className="absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-card border border-border animate-float">
              <GitPullRequest className="w-4 h-4 text-foss-green" />
              <span className="text-xs font-semibold text-foss-black">PR #42: Merged</span>
              <Badge variant="accent" className="text-[10px] py-0 px-1.5">main</Badge>
            </div>

            <div className="absolute -bottom-4 -left-3 z-20 hidden sm:flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-card border border-border">
              <Code2 className="w-4 h-4 text-foss-green" />
              <span className="text-xs font-semibold text-foss-black">git commit -m "build with love"</span>
            </div>

            {/* Terminal Card */}
            <div className="w-full rounded-2xl bg-white border border-border shadow-elevated overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-foss-lightBg border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foss-gray font-mono">
                  <Terminal className="w-3.5 h-3.5 text-foss-green" />
                  <span>foss-ceprn-terminal</span>
                </div>
                <div className="text-[10px] text-foss-gray font-mono">bash</div>
              </div>

              {/* Terminal Body */}
              <div className="p-5 font-mono text-xs sm:text-sm text-foss-black space-y-3 bg-white">
                <div className="flex items-center gap-2 text-foss-gray">
                  <span className="text-foss-green font-bold">$</span>
                  <span>curl -s https://fossceprn.org/manifesto</span>
                </div>

                <div className="p-3 rounded-xl bg-foss-lightBg border border-border space-y-1 text-xs">
                  <p className="text-foss-green font-semibold">
                    {`{`} "chapter": "FOSS UNITED · CEPrn", "status": "active" {`}`}
                  </p>
                  <p className="text-foss-black font-medium">
                    &gt; Mission: Democratizing open-source tech at CE Perumon.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-foss-gray pt-1">
                  <span className="text-foss-green font-bold">$</span>
                  <span>git status</span>
                </div>

                <div className="text-xs text-foss-gray space-y-1">
                  <p className="text-foss-black font-semibold flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-foss-green" />
                    On branch <span className="text-foss-green">master</span>
                  </p>
                  <p className="text-emerald-700">
                    + 10+ open-source workshops planned
                  </p>
                  <p className="text-emerald-700">
                    + 100+ passionate student members
                  </p>
                  <p className="text-foss-gray">
                    Ready to contribute to the global FOSS ecosystem!
                  </p>
                </div>

                <div className="flex items-center gap-2 text-foss-gray pt-1">
                  <span className="text-foss-green font-bold">$</span>
                  <span className="animate-pulse">foss-ceprn --join --now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
