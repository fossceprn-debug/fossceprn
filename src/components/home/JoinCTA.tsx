import React from "react";
import { Link } from "react-router-dom";
import { Github, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const JoinCTA: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-foss-black text-white p-8 sm:p-12 md:p-16 overflow-hidden shadow-elevated">
          {/* Subtle Background Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-foss-green/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-foss-greenLight text-xs font-semibold uppercase tracking-wider backdrop-blur-xs border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-foss-green" />
              <span>Get Involved With FOSS CEPrn</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Your Open Source Journey <span className="text-foss-green">Starts Here.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto text-balance">
              Whether you are a beginner writing your first lines of code or an experienced
              developer building complex systems, there is a place for you in our community.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-foss-green hover:bg-foss-greenHover text-white rounded-xl shadow-lg gap-2"
              >
                <Link to="/join">
                  <span>Join FOSS CEPrn</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent border-gray-700 hover:border-gray-500 text-white hover:bg-white/10 rounded-xl gap-2"
              >
                <a
                  href="https://github.com/fossceprn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="w-4 h-4" />
                  <span>Explore GitHub</span>
                </a>
              </Button>
            </div>

            {/* Micro Perks */}
            <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-foss-green" />
                <span>No Prior Experience Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-foss-green" />
                <span>Free Access to All Workshops</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-foss-green" />
                <span>Mentorship & Project Collabs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
