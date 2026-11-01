import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Sparkles,
  Github,
  Linkedin,
  ShieldCheck,
  LayoutDashboard,
  UserPlus,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getActiveExecom } from "@/lib/supabase";
import { submitExecomApplication } from "@/lib/adminService";
import { getMembershipOpenStatus } from "@/lib/credentialsService";
import { useAuth } from "@/lib/authContext";
import type { ExecomMember } from "@/types";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
];

const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

const DESIRED_ROLES = [
  "Technical Lead",
  "Event Coordinator",
  "Design & Media Lead",
  "Webmaster & Developer",
  "Documentation Lead",
  "Open Source Evangelist",
  "Sub-Coordinator / Core Volunteer",
];

export const Execom: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, isViewer } = useAuth();
  const isPrivileged = Boolean(user && (isAdmin || isSuperAdmin || isViewer));

  const [members, setMembers] = useState<ExecomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMembershipOpen, setIsMembershipOpen] = useState(true);

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [appForm, setAppForm] = useState({
    full_name: "",
    email: "",
    department: "Computer Science & Engineering",
    semester: "S5",
    desired_role: "Technical Lead",
    github_url: "",
    linkedin_url: "",
    statement_of_purpose: "",
  });

  useEffect(() => {
    async function loadExecom() {
      try {
        const [live, membershipStatus] = await Promise.all([
          getActiveExecom(),
          getMembershipOpenStatus(),
        ]);
        setMembers(live || []);
        setIsMembershipOpen(membershipStatus);
      } catch (err) {
        console.error("Failed to load execom members", err);
      } finally {
        setLoading(false);
      }
    }
    loadExecom();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await submitExecomApplication(appForm);
      setSubmittedSuccess(true);
      setAppForm({
        full_name: "",
        email: "",
        department: "Computer Science & Engineering",
        semester: "S5",
        desired_role: "Technical Lead",
        github_url: "",
        linkedin_url: "",
        statement_of_purpose: "",
      });
    } catch (err: any) {
      console.error("Failed to submit application", err);
      setSubmitError(
        err.message || "Failed to submit ExeCom application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      {/* Header Banner */}
      <section className="py-16 md:py-20 bg-foss-lightBg/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            Student Leadership
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            ExeCom <span className="text-foss-green">Team</span>
          </h1>
          <p className="text-base text-foss-gray max-w-2xl mx-auto">
            Meet the dedicated student coordinators and core team members driving open-source culture and technical workshops at College of Engineering Perumon.
          </p>

          {/* Admin Management Quick Banner */}
          {isPrivileged && (
            <div className="pt-2">
              <div className="inline-flex flex-wrap items-center justify-center gap-3 p-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Administrator Access
                </span>
                <span className="text-emerald-700">·</span>
                <Link
                  to="/admin/execom?tab=applied"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  View Applied ExeCom List →
                </Link>
                <span className="text-emerald-700">·</span>
                <Link
                  to="/admin/execom"
                  className="font-medium text-emerald-700 hover:text-emerald-900"
                >
                  Manage ExeCom Team
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Execom Directory */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">
                Loading ExeCom leadership...
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200/80 max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  New ExeCom Nominations in Progress
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The executive committee for the current academic session is being constituted. Interested students are invited to apply below!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => setApplyModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Apply for ExeCom</span>
                </Button>
                {isPrivileged && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/execom?tab=applied">
                      <span>Review Applied Candidates</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className="group rounded-2xl border border-border bg-white hover:border-foss-green hover:shadow-lg transition-all duration-300 overflow-hidden text-center flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Profile Photo */}
                    <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-foss-greenLight bg-foss-lightBg group-hover:scale-105 transition-transform duration-300">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foss-greenLight text-foss-green font-bold text-2xl">
                          {member.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foss-black tracking-tight group-hover:text-foss-green transition-colors">
                        {member.full_name}
                      </h3>
                      <p className="text-xs font-semibold text-foss-green uppercase tracking-wider">
                        {member.designation}
                      </p>
                      <p className="text-xs text-foss-gray line-clamp-1">
                        {member.department}
                      </p>
                      {member.semester && member.semester !== "Faculty" && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-foss-black bg-foss-lightBg px-2 py-0.5 rounded border border-border">
                          {member.semester}
                        </span>
                      )}
                    </div>

                    {/* Social Profile Links */}
                    <div className="flex items-center justify-center gap-3 pt-3 border-t border-border/80">
                      {member.github_url && (
                        <a
                          href={member.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-foss-gray hover:text-foss-black hover:bg-foss-lightBg transition-colors"
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
                          className="p-2 rounded-lg text-foss-gray hover:text-foss-black hover:bg-foss-lightBg transition-colors"
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

          {/* Become an ExeCom Member Callout */}
          <div className="mt-16 p-8 rounded-2xl bg-foss-lightBg border border-border text-center max-w-2xl mx-auto space-y-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isMembershipOpen
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isMembershipOpen
                ? "Leadership Applications Open"
                : "ExeCom Applications Currently Closed"}
            </div>
            <h3 className="text-xl font-bold text-foss-black">
              Interested in joining the Executive Committee?
            </h3>
            <p className="text-sm text-foss-gray max-w-lg mx-auto">
              ExeCom calls for technical leads, coordinators, and sub-coordinators occur across batches. Get involved with community initiatives, mentor peers, and lead campus open-source projects!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => {
                  setSubmittedSuccess(false);
                  setApplyModalOpen(true);
                }}
                size="lg"
                className={`${
                  isMembershipOpen
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                } font-semibold gap-2 shadow-sm`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isMembershipOpen ? "Apply for ExeCom Role" : "View Application Status"}</span>
              </Button>

              {isPrivileged ? (
                <Button asChild variant="outline" size="lg">
                  <Link to="/admin/execom?tab=applied" className="gap-1.5">
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    <span>View Applied Candidates</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="lg">
                  <Link to="/execom/login" className="gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Coordinator Sign In</span>
                  </Link>
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-400 pt-1">
              Are you an assigned ExeCom Coordinator?{" "}
              <Link to="/execom/login" className="text-emerald-700 font-semibold hover:underline">
                Sign in to ExeCom Dashboard →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PUBLIC APPLY FOR EXECOM DIALOG */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 pb-1">
              <UserPlus className="w-5 h-5" />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Apply for FOSS CEPrn ExeCom
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Submit your interest to join the Executive Committee for College of Engineering Perumon.
            </DialogDescription>
          </DialogHeader>

          {!isMembershipOpen ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  ExeCom Applications are Currently Closed
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  The executive committee has closed applications for the current term. Please check back during the next semester intake or contact the chapter administrators.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setApplyModalOpen(false)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          ) : submittedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Application Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Thank you for applying. The executive committee administrators will review your application and contact you soon.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setApplyModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} className="space-y-4 pt-2">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="Your full name"
                  value={appForm.full_name}
                  onChange={(e) =>
                    setAppForm({ ...appForm, full_name: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College / Personal Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="student@perumonec.ac.in or personal email"
                  value={appForm.email}
                  onChange={(e) =>
                    setAppForm({ ...appForm, email: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={appForm.department}
                    onChange={(e) =>
                      setAppForm({ ...appForm, department: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Semester *
                  </label>
                  <select
                    value={appForm.semester}
                    onChange={(e) =>
                      setAppForm({ ...appForm, semester: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Desired Role / Position *
                </label>
                <select
                  value={appForm.desired_role}
                  onChange={(e) =>
                    setAppForm({ ...appForm, desired_role: e.target.value })
                  }
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                >
                  {DESIRED_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Profile URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username"
                    value={appForm.github_url}
                    onChange={(e) =>
                      setAppForm({ ...appForm, github_url: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    LinkedIn Profile URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={appForm.linkedin_url}
                    onChange={(e) =>
                      setAppForm({ ...appForm, linkedin_url: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Why do you want to join ExeCom? (Motivation / Pitch) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your open source interests, previous projects, and how you want to contribute to the chapter..."
                  value={appForm.statement_of_purpose}
                  onChange={(e) =>
                    setAppForm({
                      ...appForm,
                      statement_of_purpose: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Execom;
