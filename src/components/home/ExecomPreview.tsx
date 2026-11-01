import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, ArrowRight, Users2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getActiveExecom } from "@/lib/supabase";
import type { ExecomMember } from "@/types";

export const ExecomPreview: React.FC = () => {
  const [members, setMembers] = useState<ExecomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchExecom() {
      try {
        const liveMembers = await getActiveExecom();
        if (isMounted) {
          setMembers(liveMembers);
        }
      } catch (err) {
        console.error("Error fetching execom", err);
        if (isMounted) setMembers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchExecom();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="execom" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
              Leadership Team
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
              Executive Committee
            </h2>
            <p className="text-base text-foss-gray mt-1">
              Student leaders and coordinators promoting open-source knowledge and initiatives at CE Perumon.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start sm:self-auto gap-2">
            <Link to="/execom">
              <span>View Team</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-foss-lightBg animate-pulse border border-border"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && members.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-foss-lightBg/60 border border-border max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foss-black">
              Executive Committee Details Coming Soon
            </h3>
            <p className="text-sm text-foss-gray leading-relaxed">
              The student executive committee and lead coordinators for FOSS CEPrn will be announced shortly.
              Want to get involved in organizing workshops, design, or technical sessions?
            </p>
            <Button asChild size="sm">
              <Link to="/join">Join the Volunteer Team</Link>
            </Button>
          </div>
        )}

        {/* Members Grid */}
        {!loading && members.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.slice(0, 4).map((member) => (
              <Card
                key={member.id}
                className="group overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300 text-center"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Avatar / Photo */}
                  <div className="mx-auto relative w-24 h-24">
                    <Avatar className="w-24 h-24 mx-auto ring-4 ring-foss-lightBg group-hover:ring-emerald-100 transition-all">
                      <AvatarImage
                        src={member.photo_url || ""}
                        alt={member.full_name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg bg-emerald-50 text-foss-green font-bold">
                        {member.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foss-black group-hover:text-foss-green transition-colors">
                      {member.full_name}
                    </h3>
                    <p className="text-xs font-semibold text-foss-green">
                      {member.designation}
                    </p>
                    <p className="text-xs text-foss-gray">
                      {member.department} {member.semester && `· ${member.semester}`}
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/60">
                    {member.github_url && (
                      <a
                        href={member.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-foss-gray hover:text-foss-black hover:bg-foss-lightBg transition-colors"
                        aria-label={`${member.full_name} GitHub`}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-foss-gray hover:text-foss-black hover:bg-foss-lightBg transition-colors"
                        aria-label={`${member.full_name} LinkedIn`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
