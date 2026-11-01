import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Send,
  Sparkles,
  Users,
  Code2,
  HeartHandshake,
  MessageSquare,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitMemberApplication } from "@/lib/adminService";
import { getMembershipOpenStatus } from "@/lib/credentialsService";

export const Join: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMembershipOpen, setIsMembershipOpen] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    getMembershipOpenStatus().then((status) => {
      setIsMembershipOpen(status);
      setCheckingStatus(false);
    });
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "Computer Science & Engineering",
    semester: "S1",
    githubUrl: "",
    interest: "Web & Open Source",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await submitMemberApplication(formData);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit member application", err);
      setErrorMsg(
        err.message || "Failed to submit membership application. Please try again."
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
            Join FOSS CEPrn
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            Become Part of Our <span className="text-foss-green">Community</span>
          </h1>
          <p className="text-base text-foss-gray max-w-2xl mx-auto">
            Join curious students at College of Engineering Perumon building the
            next generation of open technology, mentoring peers, and contributing to global software.
          </p>
        </div>
      </section>

      {/* Main Join Layout */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foss-black">
                  Why Join FOSS CEPrn?
                </h2>
                <p className="text-sm text-foss-gray leading-relaxed">
                  We are a passionate community of student builders, open source evangelists, and tech hobbyists collaborating to learn and share knowledge freely.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-foss-greenLight text-foss-green shrink-0 mt-0.5">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foss-black">
                      Hands-on Code & Workshops
                    </h3>
                    <p className="text-xs text-foss-gray">
                      Participate in Linux installation drives, Git bootcamps, web engineering hack nights, and kernel exploration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-foss-greenLight text-foss-green shrink-0 mt-0.5">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foss-black">
                      FOSS United Network
                    </h3>
                    <p className="text-xs text-foss-gray">
                      Connect with the wider FOSS United national network of developers, scholarships, and open hackathons.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-foss-greenLight text-foss-green shrink-0 mt-0.5">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foss-black">
                      Peer Mentorship & Projects
                    </h3>
                    <p className="text-xs text-foss-gray">
                      Build production-ready open source projects together and get direct project guidance from senior students.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Channels Box */}
              <div className="p-5 rounded-2xl bg-foss-lightBg border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foss-black">
                  <MessageSquare className="w-4 h-4 text-foss-green" />
                  <span>Student Community Groups</span>
                </div>
                <p className="text-xs text-foss-gray">
                  Join our official student discussion channels on WhatsApp or Telegram to stay notified about upcoming meetups.
                </p>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <Card className="p-8 border-border bg-white rounded-3xl shadow-sm">
                <CardContent className="p-0 space-y-6">
                  {submitted ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-foss-black">
                        Application Received!
                      </h3>
                      <p className="text-sm text-foss-gray max-w-md mx-auto leading-relaxed">
                        Thank you for your interest in joining FOSS CEPrn. Our team will verify your
                        details and contact you with onboarding information for the upcoming session.
                      </p>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto space-y-1">
                        <div>
                          Submitted by: <strong className="text-slate-900">{formData.fullName}</strong>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">{formData.email}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">{formData.department} · {formData.semester}</div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            fullName: "",
                            email: "",
                            department: "Computer Science & Engineering",
                            semester: "S1",
                            githubUrl: "",
                            interest: "Web & Open Source",
                            notes: "",
                          });
                        }}
                        className="mt-4 text-xs font-semibold"
                      >
                        Submit Another Response
                      </Button>
                    </div>
                  ) : !checkingStatus && !isMembershipOpen ? (
                    <div className="text-center py-12 px-4 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">
                        Execom Membership Applications are Currently Closed
                      </h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Recruitment for new ExeCom members is currently closed by the chapter administration. Please check back during the next semester intake or join our student community channels for future announcements.
                      </p>
                      <div className="pt-2 flex justify-center">
                        <a
                          href="https://chat.whatsapp.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span>Join Community Channels</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <h3 className="text-xl font-bold text-foss-black">
                          Execom Membership Interest Form
                        </h3>
                        <p className="text-xs text-foss-gray mt-1">
                          Submit your details below to apply for FOSS CEPrn Executive Committee membership and core student chapter initiatives.
                        </p>
                      </div>

                      {errorMsg && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-foss-black mb-1.5">
                            Full Name *
                          </label>
                          <Input
                            required
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) =>
                              setFormData({ ...formData, fullName: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foss-black mb-1.5">
                            College / Personal Email *
                          </label>
                          <Input
                            required
                            type="email"
                            placeholder="student@perumonec.ac.in or personal email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-foss-black mb-1.5">
                              Department *
                            </label>
                            <select
                              value={formData.department}
                              onChange={(e) =>
                                setFormData({ ...formData, department: e.target.value })
                              }
                              className="w-full h-10 px-3 text-sm bg-white border border-border rounded-md text-foss-black focus:outline-none focus:ring-2 focus:ring-foss-green"
                            >
                              <option>Computer Science & Engineering</option>
                              <option>Information Technology</option>
                              <option>Electronics & Communication</option>
                              <option>Electrical & Electronics</option>
                              <option>Mechanical Engineering</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-foss-black mb-1.5">
                              Semester *
                            </label>
                            <select
                              value={formData.semester}
                              onChange={(e) =>
                                setFormData({ ...formData, semester: e.target.value })
                              }
                              className="w-full h-10 px-3 text-sm bg-white border border-border rounded-md text-foss-black focus:outline-none focus:ring-2 focus:ring-foss-green"
                            >
                              <option>S1</option>
                              <option>S2</option>
                              <option>S3</option>
                              <option>S4</option>
                              <option>S5</option>
                              <option>S6</option>
                              <option>S7</option>
                              <option>S8</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foss-black mb-1.5">
                            GitHub Profile (Optional)
                          </label>
                          <Input
                            type="url"
                            placeholder="https://github.com/username"
                            value={formData.githubUrl}
                            onChange={(e) =>
                              setFormData({ ...formData, githubUrl: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foss-black mb-1.5">
                            Primary Area of Interest
                          </label>
                          <select
                            value={formData.interest}
                            onChange={(e) =>
                              setFormData({ ...formData, interest: e.target.value })
                            }
                            className="w-full h-10 px-3 text-sm bg-white border border-border rounded-md text-foss-black focus:outline-none focus:ring-2 focus:ring-foss-green"
                          >
                            <option>Web & Open Source</option>
                            <option>Systems & Linux Kernel</option>
                            <option>Mobile App Development</option>
                            <option>Cyber Security & Privacy Tooling</option>
                            <option>UI/UX Design & Branding</option>
                            <option>DevOps & Cloud Computing</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foss-black mb-1.5">
                            Notes / What excites you about FOSS? (Optional)
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Tell us what you'd love to learn or build with FOSS CEPrn..."
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData({ ...formData, notes: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit ExeCom Application</span>
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Join;
