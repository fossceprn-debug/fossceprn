import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Printer,
  QrCode,
  Share2,
  X,
  Sparkles,
  User,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { registerForEvent } from "@/lib/adminService";
import { generateInvitationPassImage, generateTicketPdf, getEventPassTheme } from "@/lib/passGenerator";
import { sendTicketEmail } from "@/lib/emailService";
import type { EventItem, EventRegistration, RegistrationQuestion } from "@/types";

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [stage, setStage] = useState<"form" | "ticket">("form");
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPass, setDownloadingPass] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [emailError, setEmailError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Base Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classSemester, setClassSemester] = useState("");

  // Dynamic Custom Question Responses (keyed by question.id)
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

  // Generated Registration Result
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const ticketRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStage("form");
      setErrorMessage("");
      setFullName("");
      setEmail("");
      setPhone("");
      setClassSemester("");
      setCustomResponses({});
      setRegistration(null);
      setQrDataUrl("");
      autoDownloadedRef.current = false;
    }
  }, [isOpen, event.id]);

  // Generate QR Code when registration is ready
  useEffect(() => {
    if (registration) {
      const qrPayload = JSON.stringify({
        ticket_code: registration.ticket_code,
        event_id: registration.event_id,
        event_title: event.title,
        attendee: registration.full_name,
        email: registration.email,
        timestamp: registration.created_at,
      });

      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1,
        color: {
          dark: "#000000", // Pure black for crisp scanning
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error("QR Code generation error:", err);
          // Fallback to plain code
          QRCode.toDataURL(registration.ticket_code, { width: 320, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => {});
        });
    }
  }, [registration, event.title]);

  const passTheme = getEventPassTheme(event);

  const handleCustomResponseChange = (questionId: string, value: any) => {
    setCustomResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage("Full Name and Email Address are required.");
      return;
    }

    // Check custom required questions
    const questions: RegistrationQuestion[] = event.registration_questions || [];
    for (const q of questions) {
      if (q.required && (!customResponses[q.id] || customResponses[q.id].toString().trim() === "")) {
        setErrorMessage(`Please answer the required question: "${q.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await registerForEvent({
        event_id: event.id,
        full_name: fullName,
        email: email,
        phone: phone,
        class_semester: classSemester,
        responses: customResponses,
      });

      if (res.error) {
        setErrorMessage(res.error);
        setSubmitting(false);
        return;
      }

      setRegistration(res.registration);
      setStage("ticket");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdfTicket = async () => {
    if (!qrDataUrl || !registration) return;
    setDownloadingPdf(true);
    try {
      const pdfResult = await generateTicketPdf({
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        attendeeName: registration.full_name,
        attendeeEmail: registration.email,
        attendeePhone: registration.phone,
        classSemester: registration.class_semester,
        ticketCode: registration.ticket_code,
        qrDataUrl: qrDataUrl,
        coordinator1Name: event.coordinator1_name || event.coordinator_name || "FOSS Chapter Lead",
        coordinator1Phone: event.coordinator1_phone || event.coordinator_phone || "",
        coordinator2Name: event.coordinator2_name || "",
        coordinator2Phone: event.coordinator2_phone || "",
        eventId: event.id,
        eventSlug: event.slug,
        theme: passTheme,
      });

      const link = document.createElement("a");
      link.href = pdfResult.pdfDataUri;
      link.download = pdfResult.filename;
      link.click();
    } catch (err: any) {
      console.error("Failed to generate PDF ticket:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!qrDataUrl || !registration) return;
    setDownloadingPass(true);
    try {
      const passImageUri = await generateInvitationPassImage({
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        attendeeName: registration.full_name,
        attendeeEmail: registration.email,
        attendeePhone: registration.phone,
        classSemester: registration.class_semester,
        ticketCode: registration.ticket_code,
        qrDataUrl: qrDataUrl,
        coordinator1Name: event.coordinator1_name || event.coordinator_name || "FOSS Chapter Lead",
        coordinator1Phone: event.coordinator1_phone || event.coordinator_phone || "",
        coordinator2Name: event.coordinator2_name || "",
        coordinator2Phone: event.coordinator2_phone || "",
        eventId: event.id,
        eventSlug: event.slug,
        theme: passTheme,
      });

      const link = document.createElement("a");
      link.href = passImageUri;
      link.download = `Invitation-Pass-${registration.ticket_code}-${event.slug || "event"}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate invitation pass image, downloading raw QR:", err);
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `Ticket-${registration.ticket_code}.png`;
      link.click();
    } finally {
      setDownloadingPass(false);
    }
  };

  const handleAutoProcessAndEmail = async () => {
    if (!qrDataUrl || !registration) return;
    setDownloadingPdf(true);
    setEmailStatus("sending");
    setEmailError("");

    try {
      // 1. Generate PDF Ticket
      const pdfResult = await generateTicketPdf({
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        attendeeName: registration.full_name,
        attendeeEmail: registration.email,
        attendeePhone: registration.phone,
        classSemester: registration.class_semester,
        ticketCode: registration.ticket_code,
        qrDataUrl: qrDataUrl,
        coordinator1Name: event.coordinator1_name || event.coordinator_name || "FOSS Chapter Lead",
        coordinator1Phone: event.coordinator1_phone || event.coordinator_phone || "",
        coordinator2Name: event.coordinator2_name || "",
        coordinator2Phone: event.coordinator2_phone || "",
        eventId: event.id,
        eventSlug: event.slug,
        theme: passTheme,
      });

      // 2. Automatically download PDF ticket to student's device
      const link = document.createElement("a");
      link.href = pdfResult.pdfDataUri;
      link.download = pdfResult.filename;
      link.click();
      setDownloadingPdf(false);

      // 3. Dispatch automated ticket email via Resend Free API & Supabase Edge Function
      const emailRes = await sendTicketEmail({
        registrationId: registration.id,
        toEmail: registration.email,
        attendeeName: registration.full_name,
        ticketCode: registration.ticket_code,
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        pdfBase64: pdfResult.pdfBase64,
        qrDataUrl: qrDataUrl,
        coordinatorName: [event.coordinator1_name, event.coordinator2_name].filter(Boolean).join(" & ") || event.coordinator_name || "FOSS Chapter Lead",
        coordinatorPhone: event.coordinator1_phone || event.coordinator_phone || "",
      });

      if (emailRes.success) {
        setEmailStatus("sent");
      } else {
        setEmailStatus("failed");
        setEmailError(emailRes.error || "Email delivery failed.");
      }
    } catch (err: any) {
      console.error("Auto processing error:", err);
      setDownloadingPdf(false);
      setEmailStatus("failed");
      setEmailError(err?.message || "Failed to deliver ticket email.");
    }
  };

  // Automatically download PDF ticket & dispatch email immediately upon reaching ticket stage
  useEffect(() => {
    if (stage === "ticket" && qrDataUrl && registration && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      handleAutoProcessAndEmail();
    }
  }, [stage, qrDataUrl, registration]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${stage === "form" ? "max-w-xl" : "max-w-3xl"} p-0 overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-2xl`}>
        {stage === "form" ? (
          <div>
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-semibold tracking-wide border border-emerald-400/30">
                  <Sparkles className="w-3 h-3" />
                  <span>On-site Registration</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Register for {event.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100/90 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="truncate max-w-[200px]">{event.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-7 max-h-[70vh] overflow-y-auto space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Standard Questions */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        placeholder="e.g. Adithyan M"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          type="email"
                          placeholder="student@cep.in or personal"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-10 text-xs rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-9 h-10 text-xs rounded-xl border-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Class / Semester & Branch *
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        placeholder="e.g. S5 Computer Science & Engineering"
                        value={classSemester}
                        onChange={(e) => setClassSemester(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Event-specific Custom Questions */}
                {event.registration_questions && event.registration_questions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Additional Event Questions
                    </h4>
                    {event.registration_questions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          {q.label} {q.required && <span className="text-rose-500">*</span>}
                        </label>

                        {q.type === "select" ? (
                          <select
                            required={q.required}
                            value={customResponses[q.id] || ""}
                            onChange={(e) => handleCustomResponseChange(q.id, e.target.value)}
                            className="h-10 w-full px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                          >
                            <option value="">Select an option...</option>
                            {(q.options || []).map((opt, idx) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : q.type === "textarea" ? (
                          <textarea
                            required={q.required}
                            rows={3}
                            placeholder={q.placeholder || "Enter your answer..."}
                            value={customResponses[q.id] || ""}
                            onChange={(e) => handleCustomResponseChange(q.id, e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-600 leading-relaxed"
                          />
                        ) : (
                          <Input
                            required={q.required}
                            type={q.type === "number" ? "number" : "text"}
                            placeholder={q.placeholder || "Enter your answer..."}
                            value={customResponses[q.id] || ""}
                            onChange={(e) => handleCustomResponseChange(q.id, e.target.value)}
                            className="h-10 text-xs rounded-xl border-slate-200"
                          />
                        )}

                        {q.help_text && (
                          <p className="text-[11px] text-slate-400 mt-1">{q.help_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="h-10 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-6 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Confirm & Get Ticket</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Stage 2: Check-in Ticket Pass with QR Code */
          <div className="p-4 sm:p-6 max-h-[86vh] overflow-y-auto space-y-5 bg-slate-50">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Registration Confirmed!</h3>
              <p className="text-xs text-slate-500">
                Your official entry pass has been generated and displayed below.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PDF Ticket automatically downloaded!</span>
                </div>

                {emailStatus === "sending" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span>Emailing ticket to {registration?.email}...</span>
                  </div>
                )}

                {emailStatus === "sent" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ticket delivered to {registration?.email}</span>
                  </div>
                )}

                {emailStatus === "failed" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200" title={emailError}>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Email pending: please keep downloaded PDF</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Card Pass matching the official template */}
            <div
              ref={ticketRef}
              className="relative rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Main Body (~68% width on desktop) */}
              <div className="flex-1 p-5 sm:p-6 relative flex flex-col justify-between overflow-hidden bg-white">
                {/* Decorative background ribbons in bottom-left corner */}
                <div
                  className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-xl"
                  style={{ backgroundColor: passTheme.primary }}
                />
                <div
                  className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full pointer-events-none opacity-30"
                  style={{ backgroundColor: passTheme.softTint }}
                />

                <div className="space-y-4 relative z-10">
                  {/* Top Header: FOSS badge + Chapter Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3.5 py-1.5 rounded-xl text-white font-black text-sm tracking-wider shadow-xs"
                      style={{ backgroundColor: passTheme.primary }}
                    >
                      FOSS
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="space-y-0.5">
                      <h5
                        className="text-xs font-black uppercase tracking-wider leading-none"
                        style={{ color: passTheme.primaryDark }}
                      >
                        FOSS UNITED STUDENTS CHAPTER
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                        COLLEGE OF ENGINEERING PERUMON
                      </p>
                    </div>
                  </div>

                  {/* Heading: INVITATION PASS & SUBTITLE */}
                  <div className="text-center pt-1 pb-1">
                    <h2
                      className="text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: passTheme.primaryDark }}
                    >
                      INVITATION PASS
                    </h2>
                    <div className="flex items-center justify-center gap-3 mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <div className="h-px w-10 sm:w-16" style={{ backgroundColor: passTheme.primaryDark }} />
                      <span style={{ color: passTheme.primaryDark }}>FOR ATTENDING THE EVENT</span>
                      <div className="h-px w-10 sm:w-16" style={{ backgroundColor: passTheme.primaryDark }} />
                    </div>
                    {/* Prominent Event Name */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>

                  {/* Info Pill Box (Date/Time & Venue) */}
                  <div
                    className="rounded-2xl p-3 sm:p-3.5 border grid grid-cols-1 sm:grid-cols-2 gap-3 items-center"
                    style={{ backgroundColor: passTheme.softTint, borderColor: passTheme.borderTint }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: passTheme.primary + "18", color: passTheme.primaryDark }}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: passTheme.primaryDark }}>
                          {formatDate(event.start_date)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">Event Schedule</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-3"
                      style={{ borderColor: passTheme.borderTint }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: passTheme.primary + "18", color: passTheme.primaryDark }}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate max-w-[170px]" style={{ color: passTheme.primaryDark }}>
                          {event.venue || "College Campus"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">Campus Lab / Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendee & Coordinator Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider block"
                        style={{ color: passTheme.primary }}
                      >
                        REGISTERED ATTENDEE
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {registration?.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {registration?.class_semester || registration?.email}
                      </p>
                    </div>

                    <div>
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider block"
                        style={{ color: passTheme.primary }}
                      >
                        EVENT COORDINATORS
                      </span>
                      <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">
                        {[event.coordinator1_name, event.coordinator2_name].filter(Boolean).join(" & ") ||
                          event.coordinator_name ||
                          "FOSS Chapter Coordinators"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {event.coordinator1_phone || event.coordinator2_phone || event.coordinator_phone
                          ? `Ph: ${[event.coordinator1_phone, event.coordinator2_phone].filter(Boolean).join(" / ") || event.coordinator_phone}`
                          : "FOSS CEPerumon Chapter"}
                      </p>
                    </div>
                  </div>

                  {/* Diamond ornament divider & Save warning */}
                  <div className="pt-2 text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-px w-16" style={{ backgroundColor: passTheme.borderTint }} />
                      <span className="text-xs" style={{ color: passTheme.primary }}>◆</span>
                      <div className="h-px w-16" style={{ backgroundColor: passTheme.borderTint }} />
                    </div>
                    <p
                      className="text-[11px] font-extrabold tracking-wide uppercase"
                      style={{ color: passTheme.primaryDark }}
                    >
                      ⚠️ SAVE THIS QR PASS • DO NOT MISS IT • SHOW AT ENTRY DESK
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Cutout Notches / Divider on desktop */}
              <div className="relative hidden md:flex flex-col items-center justify-between py-2 -mx-3 z-20">
                <div className="w-6 h-6 rounded-full bg-slate-50 shadow-inner -mt-3" />
                <div className="h-full border-r-2 border-dashed border-white/40 my-1" />
                <div className="w-6 h-6 rounded-full bg-slate-50 shadow-inner -mb-3" />
              </div>

              {/* Right Ticket Stub (~32% width) */}
              <div
                className="w-full md:w-64 p-5 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
                style={{ background: passTheme.cssStubGradient }}
              >
                {/* Decorative ambient shine */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="space-y-3 relative z-10 w-full flex flex-col items-center">
                  {/* White Rounded QR Card */}
                  <div className="bg-white p-2.5 rounded-2xl shadow-lg inline-block">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Verified Check-in QR Code"
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Monospace Ticket Code Pill */}
                  <div
                    className="w-full max-w-[210px] py-1.5 px-3 rounded-full border-2 border-white/60 text-white font-mono text-sm sm:text-base font-black tracking-widest shadow-inner text-center"
                    style={{ backgroundColor: passTheme.pillBg }}
                  >
                    {registration?.ticket_code}
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-white">
                      SCAN FOR ENTRY CHECK-IN
                    </p>
                    <p className="text-[9px] font-medium tracking-wide text-white/70">
                      FOSS UNITED CEPRN
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-10 text-xs gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pass</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadingPass}
                  onClick={handleDownloadTicket}
                  className="h-10 text-xs font-semibold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  {downloadingPass ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Pass (Image)</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={downloadingPdf}
                  onClick={handleDownloadPdfTicket}
                  className="h-10 text-xs font-bold gap-1.5 rounded-xl text-white shadow-md transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: passTheme.primary }}
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF Ticket</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={onClose}
                  className="h-10 px-5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

