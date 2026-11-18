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
        width: 250,
        margin: 2,
        color: {
          dark: "#064e3b", // Deep emerald
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error("QR Code generation error:", err);
          // Fallback to plain code
          QRCode.toDataURL(registration.ticket_code, { width: 250, margin: 2 })
            .then(setQrDataUrl)
            .catch(() => {});
        });
    }
  }, [registration, event.title]);

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

  const handleDownloadTicket = () => {
    if (!qrDataUrl || !registration) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `Ticket-${registration.ticket_code}-${event.slug || "foss"}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-2xl">
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
          <div className="p-6 sm:p-7 max-h-[85vh] overflow-y-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Registration Confirmed!</h3>
              <p className="text-xs text-slate-500">
                You're all set for the workshop. Save or screenshot your unique check-in pass.
              </p>
            </div>

            {/* Ticket Card Pass */}
            <div
              ref={ticketRef}
              className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-7 border border-emerald-500/30 shadow-2xl overflow-hidden"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                    F
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                    FOSS CEPrn Pass
                  </span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px] font-mono uppercase tracking-widest">
                  Verified Pass
                </Badge>
              </div>

              {/* Event & Attendee Info */}
              <div className="py-5 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">
                    Event
                  </span>
                  <h4 className="text-lg font-black text-white leading-tight mt-0.5">
                    {event.title}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-300/70 block">
                      Date & Schedule
                    </span>
                    <span className="font-bold text-slate-100">{formatDate(event.start_date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-300/70 block">
                      Venue
                    </span>
                    <span className="font-bold text-slate-100 truncate block">{event.venue}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-300/70 block">
                      Attendee Name
                    </span>
                    <span className="font-bold text-white text-sm">
                      {registration?.full_name}
                    </span>
                    <span className="text-[11px] text-emerald-300/80 block font-mono">
                      {registration?.class_semester}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-300/70 block">
                      Registered Email
                    </span>
                    <span className="font-mono text-[11px] text-slate-200 truncate block">
                      {registration?.email}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ph: {registration?.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perforated separator */}
              <div className="relative py-2 flex items-center justify-between">
                <div className="w-5 h-5 bg-white rounded-full -ml-8.5 shrink-0" />
                <div className="flex-1 border-b-2 border-dashed border-emerald-500/30 mx-2" />
                <div className="w-5 h-5 bg-white rounded-full -mr-8.5 shrink-0" />
              </div>

              {/* QR Code and Ticket ID Area */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Check-in QR Code"
                      className="w-32 h-32 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1.5 flex-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">
                    Unique Check-In Code
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-emerald-300 tracking-wider bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                    {registration?.ticket_code}
                  </div>
                  <p className="text-[10px] text-emerald-200/70 max-w-[190px] leading-tight">
                    Show this QR code at the desk upon entry for rapid verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-10 text-xs gap-1.5 rounded-xl border-slate-200 text-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTicket}
                  className="h-10 text-xs gap-1.5 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Pass</span>
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
