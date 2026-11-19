
import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  User,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatDate } from "@/lib/utils";
import { registerForEvent } from "@/lib/adminService";

import {
  generateInvitationPassImage,
  generateTicketPdf,
  getEventPassTheme,
} from "@/lib/passGenerator";

import { sendTicketEmail } from "@/lib/emailService";

import type {
  EventItem,
  EventRegistration,
  RegistrationQuestion,
} from "@/types";

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
}

export const EventRegistrationModal: React.FC<
  EventRegistrationModalProps
> = ({ isOpen, onClose, event }) => {

  const [stage, setStage] = useState<"form" | "ticket">("form");
  const [submitting, setSubmitting] = useState(false);

  const [downloadingPass, setDownloadingPass] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  const [emailError, setEmailError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Registration fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classSemester, setClassSemester] = useState("");

  // Dynamic question responses
  const [customResponses, setCustomResponses] = useState<
    Record<string, any>
  >({});

  // Registration result
  const [registration, setRegistration] =
    useState<EventRegistration | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState("");

  const ticketRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef(false);

  const passTheme = getEventPassTheme(event);

  // Reset when modal opens
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
      setEmailStatus("idle");
      setEmailError("");
      autoDownloadedRef.current = false;
    }
  }, [isOpen, event.id]);

  // Generate registration QR
  useEffect(() => {
    if (!registration) return;

    const qrPayload = JSON.stringify({
      ticket_code: registration.ticket_code,
      event_id: registration.event_id,
      event_title: event.title,
      attendee: registration.full_name,
      email: registration.email,
      timestamp: registration.created_at,
    });

    QRCode.toDataURL(qrPayload, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => {
        console.error("QR generation error:", err);

        QRCode.toDataURL(registration.ticket_code, {
          width: 600,
          margin: 2,
        })
          .then(setQrDataUrl)
          .catch(() => { });
      });
  }, [registration, event.title]);

  // Custom question handler
  const handleCustomResponseChange = (
    questionId: string,
    value: any
  ) => {
    setCustomResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Registration submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !phone.trim() || !classSemester.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    const questions: RegistrationQuestion[] =
      event.registration_questions || [];

    for (const q of questions) {
      if (
        q.required &&
        (!customResponses[q.id] ||
          customResponses[q.id].toString().trim() === "")
      ) {
        setErrorMessage(
          `Please answer the required question: "${q.label}"`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await registerForEvent({
        event_id: event.id,
        full_name: fullName,
        email,
        phone,
        class_semester: classSemester,
        responses: customResponses,
      });

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      setRegistration(res.registration);
      setStage("ticket");

    } catch (err: any) {
      setErrorMessage(
        err.message || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Shared ticket generation parameters
  const getTicketOptions = () => {
    if (!registration) return null;

    return {
      eventTitle: event.title,
      startDate: event.start_date,
      venue: event.venue,
      attendeeName: registration.full_name,
      attendeeEmail: registration.email,
      attendeePhone: registration.phone,
      classSemester: registration.class_semester,
      ticketCode: registration.ticket_code,
      qrDataUrl,
      coordinator1Name:
        event.coordinator1_name ||
        event.coordinator_name ||
        "FOSS Chapter Lead",
      coordinator1Phone:
        event.coordinator1_phone ||
        event.coordinator_phone ||
        "",
      coordinator2Name: event.coordinator2_name || "",
      coordinator2Phone: event.coordinator2_phone || "",
      eventId: event.id,
      eventSlug: event.slug,
      theme: passTheme,
    };
  };

  // PDF download
  const handleDownloadPdfTicket = async () => {
    const options = getTicketOptions();
    if (!options) return;

    setDownloadingPdf(true);

    try {
      const pdfResult = await generateTicketPdf(options);

      const link = document.createElement("a");
      link.href = pdfResult.pdfDataUri;
      link.download = pdfResult.filename;
      link.click();

    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Image download
  const handleDownloadTicket = async () => {
    const options = getTicketOptions();
    if (!options || !registration) return;

    setDownloadingPass(true);

    try {
      const passImageUri =
        await generateInvitationPassImage(options);

      const link = document.createElement("a");
      link.href = passImageUri;
      link.download =
        `Invitation-Pass-${registration.ticket_code}-${event.slug || "event"}.png`;

      link.click();

    } catch (err) {
      console.error("Image generation failed:", err);

      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `Ticket-${registration.ticket_code}.png`;
      link.click();

    } finally {
      setDownloadingPass(false);
    }
  };

  // Automatically download PDF and email ticket
  const handleAutoProcessAndEmail = async () => {
    const options = getTicketOptions();

    if (!options || !registration) return;

    setDownloadingPdf(true);
    setEmailStatus("sending");
    setEmailError("");

    try {
      const pdfResult = await generateTicketPdf(options);

      const link = document.createElement("a");
      link.href = pdfResult.pdfDataUri;
      link.download = pdfResult.filename;
      link.click();

      setDownloadingPdf(false);

      const emailRes = await sendTicketEmail({
        registrationId: registration.id,
        toEmail: registration.email,
        attendeeName: registration.full_name,
        ticketCode: registration.ticket_code,
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        pdfBase64: pdfResult.pdfBase64,
        qrDataUrl,
        coordinatorName:
          [
            event.coordinator1_name,
            event.coordinator2_name,
          ].filter(Boolean).join(" & ") ||
          event.coordinator_name ||
          "FOSS Chapter Lead",
        coordinatorPhone:
          event.coordinator1_phone ||
          event.coordinator_phone ||
          "",
      });

      if (emailRes.success) {
        setEmailStatus("sent");
      } else {
        setEmailStatus("failed");
        setEmailError(emailRes.error || "Email delivery failed.");
      }

    } catch (err: any) {
      console.error("Ticket processing error:", err);

      setDownloadingPdf(false);
      setEmailStatus("failed");
      setEmailError(err?.message || "Ticket delivery failed.");
    }
  };

  // Automatically process ticket once QR is ready
  useEffect(() => {
    if (
      stage === "ticket" &&
      qrDataUrl &&
      registration &&
      !autoDownloadedRef.current
    ) {
      autoDownloadedRef.current = true;
      handleAutoProcessAndEmail();
    }
  }, [stage, qrDataUrl, registration]);

  const handlePrint = () => {
    window.print();
  };

  const coordinatorNames =
    [
      event.coordinator1_name,
      event.coordinator2_name,
    ].filter(Boolean).join(" & ") ||
    event.coordinator_name ||
    "FOSS Chapter Coordinator";

  const coordinatorPhone =
    event.coordinator1_phone ||
    event.coordinator2_phone ||
    event.coordinator_phone ||
    "";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className={`${stage === "form" ? "max-w-xl" : "max-w-[520px]"
          } p-0 overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl`}
      >

        {/* ================================================== */}
        {/* REGISTRATION FORM */}
        {/* ================================================== */}

        {stage === "form" ? (

          <div>

            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white p-7">

              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />

              <div className="relative z-10 space-y-3">

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  ON-SITE REGISTRATION
                </div>

                <h3 className="text-2xl font-black tracking-tight">
                  Register for {event.title}
                </h3>

                <div className="flex flex-wrap gap-4 text-xs text-emerald-100">

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(event.start_date)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>

                </div>

              </div>
            </div>

            <div className="p-6 sm:p-7 max-h-[70vh] overflow-y-auto">

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Full Name *
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    <Input
                      required
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Email Address *
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <Input
                        required
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Phone / WhatsApp *
                    </label>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <Input
                        required
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Class / Semester & Branch *
                  </label>

                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    <Input
                      required
                      placeholder="S5 Computer Science & Engineering"
                      value={classSemester}
                      onChange={(e) => setClassSemester(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Dynamic Questions */}

                {event.registration_questions &&
                  event.registration_questions.length > 0 && (

                    <div className="pt-4 border-t space-y-4">

                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Additional Event Questions
                      </h4>

                      {event.registration_questions.map((q) => (

                        <div key={q.id}>

                          <label className="block text-xs font-bold mb-1.5">
                            {q.label}
                            {q.required && (
                              <span className="text-rose-500"> *</span>
                            )}
                          </label>

                          {q.type === "select" ? (

                            <select
                              required={q.required}
                              value={customResponses[q.id] || ""}
                              onChange={(e) =>
                                handleCustomResponseChange(
                                  q.id,
                                  e.target.value
                                )
                              }
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white"
                            >
                              <option value="">
                                Select an option...
                              </option>

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
                              placeholder={q.placeholder || "Enter your answer"}
                              value={customResponses[q.id] || ""}
                              onChange={(e) =>
                                handleCustomResponseChange(
                                  q.id,
                                  e.target.value
                                )
                              }
                              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                            />

                          ) : (

                            <Input
                              required={q.required}
                              type={q.type === "number" ? "number" : "text"}
                              placeholder={q.placeholder || "Enter your answer"}
                              value={customResponses[q.id] || ""}
                              onChange={(e) =>
                                handleCustomResponseChange(
                                  q.id,
                                  e.target.value
                                )
                              }
                              className="h-11 rounded-xl"
                            />

                          )}

                          {q.help_text && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              {q.help_text}
                            </p>
                          )}

                        </div>
                      ))}

                    </div>
                  )}

                <div className="pt-4 border-t flex justify-between items-center">

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 gap-2"
                  >

                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Ticket...
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        Confirm & Get Ticket
                      </>
                    )}

                  </Button>

                </div>

              </form>
            </div>

          </div>

        ) : (

          /* ================================================== */
          /* PORTRAIT INVITATION PASS */
          /* ================================================== */

          <div className="bg-slate-100 p-3 sm:p-5 max-h-[90vh] overflow-y-auto space-y-4">

            {/* Registration Status */}

            <div className="text-center space-y-2 py-2">

              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-900">
                Registration Confirmed!
              </h3>

              <p className="text-xs text-slate-500">
                Your official FOSS entry pass is ready.
              </p>

              <div className="flex flex-wrap justify-center gap-2">

                {emailStatus === "sending" && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                    Sending ticket email...
                  </span>
                )}

                {emailStatus === "sent" && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Ticket emailed successfully
                  </span>
                )}

                {emailStatus === "failed" && (
                  <span
                    className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold"
                    title={emailError}
                  >
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Email delivery pending
                  </span>
                )}

              </div>
            </div>

            {/* PORTRAIT PASS CARD */}

            <div
              ref={ticketRef}
              className="relative max-w-[410px] mx-auto bg-white rounded-[28px] overflow-hidden shadow-xl border"
              style={{ borderColor: passTheme.borderTint }}
            >

              {/* Top Theme Banner */}

              <div
                className="relative px-6 pt-7 pb-6 overflow-hidden"
                style={{ backgroundColor: passTheme.primaryDark }}
              >

                <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/10" />

                <div className="absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-white/10" />

                <div className="relative z-10">

                  {/* Branding */}

                  <div className="flex items-center gap-3">

                    <div className="bg-white text-slate-900 font-black text-xl px-4 py-2 rounded-xl shadow-md">
                      FOSS
                    </div>

                    <div className="h-9 w-px bg-white/30" />

                    <div className="text-white">

                      <h5 className="text-[11px] font-black uppercase tracking-wide">
                        FOSS UNITED STUDENTS CHAPTER
                      </h5>

                      <p className="text-[9px] text-white/70 font-bold tracking-wider mt-1">
                        COLLEGE OF ENGINEERING PERUMON
                      </p>

                    </div>

                  </div>

                  {/* Title */}

                  <div className="text-center mt-8">

                    <p className="text-[10px] text-white/70 font-black tracking-[4px] uppercase">
                      OFFICIAL ENTRY PASS
                    </p>

                    <h2 className="text-3xl font-black text-white tracking-tight mt-2">
                      INVITATION
                    </h2>

                    <div className="flex items-center justify-center gap-3 mt-2">

                      <div className="w-10 h-px bg-white/50" />

                      <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">
                        FOR ATTENDING THE EVENT
                      </span>

                      <div className="w-10 h-px bg-white/50" />

                    </div>

                  </div>

                </div>

              </div>

              {/* Participant Section */}

              <div className="px-6 pt-6 pb-5 text-center">

                <p
                  className="text-[10px] font-black tracking-[3px] uppercase"
                  style={{ color: passTheme.primary }}
                >
                  THIS PASS IS ISSUED TO
                </p>

                <h3
                  className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 mt-2 break-words"
                  style={{ color: passTheme.primaryDark }}
                >
                  {registration?.full_name}
                </h3>

                <div
                  className="w-16 h-1 rounded-full mx-auto mt-3"
                  style={{ backgroundColor: passTheme.primary }}
                />

                <h4 className="text-lg font-extrabold text-slate-800 mt-4 break-words">
                  {event.title}
                </h4>

                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                  EVENT PARTICIPANT
                </p>

              </div>

              {/* Date and Venue */}

              <div
                className="mx-5 rounded-2xl p-4 grid grid-cols-2 gap-3 border"
                style={{
                  backgroundColor: passTheme.softTint,
                  borderColor: passTheme.borderTint,
                }}
              >

                <div className="flex gap-2 items-start">

                  <div
                    className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: passTheme.primary + "20",
                      color: passTheme.primary,
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">

                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      DATE
                    </p>

                    <p
                      className="text-xs font-black mt-1"
                      style={{ color: passTheme.primaryDark }}
                    >
                      {formatDate(event.start_date)}
                    </p>

                  </div>

                </div>

                <div
                  className="flex gap-2 items-start border-l pl-3"
                  style={{ borderColor: passTheme.borderTint }}
                >

                  <div
                    className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: passTheme.primary + "20",
                      color: passTheme.primary,
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">

                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      VENUE
                    </p>

                    <p
                      className="text-xs font-black mt-1 break-words"
                      style={{ color: passTheme.primaryDark }}
                    >
                      {event.venue || "College Campus"}
                    </p>

                  </div>

                </div>

              </div>

              {/* QR CODE SECTION */}

              <div className="mt-6 px-5">

                <div
                  className="rounded-[24px] p-5 text-center overflow-hidden"
                  style={{
                    backgroundColor: passTheme.primaryDark,
                  }}
                >

                  <div className="flex items-center justify-center gap-2 mb-4">

                    <div className="w-7 h-px bg-white/40" />

                    <p className="text-[10px] text-white font-black tracking-[3px] uppercase">
                      ENTRY VERIFICATION
                    </p>

                    <div className="w-7 h-px bg-white/40" />

                  </div>

                  {/* Larger QR */}

                  <div className="relative bg-white p-3 rounded-2xl inline-flex items-center justify-center shadow-xl">

                    {qrDataUrl ? (

                      <img
                        src={qrDataUrl}
                        alt="FOSS Entry Verification QR Code"
                        className="w-[240px] h-[240px] object-contain"
                      />

                    ) : (

                      <div className="w-[240px] h-[240px] flex items-center justify-center">

                        <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />

                      </div>

                    )}

                  </div>

                  <p className="text-white text-[10px] font-black uppercase tracking-widest mt-4">
                    SCAN QR CODE FOR ENTRY CHECK-IN
                  </p>

                  <p className="text-white/60 text-[9px] mt-1">
                    FOSS UNITED STUDENTS CHAPTER
                  </p>

                </div>

              </div>

              {/* Ticket Code */}

              <div className="px-5 pt-5 text-center">

                <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase mb-2">
                  YOUR UNIQUE TICKET NUMBER
                </p>

                <div
                  className="inline-block px-8 py-3 rounded-full text-white font-mono font-black tracking-[2px] text-base shadow-md"
                  style={{ backgroundColor: passTheme.primaryDark }}
                >
                  {registration?.ticket_code}
                </div>

              </div>

              {/* Attendee Information */}

              <div className="px-5 pt-5">

                <div
                  className="rounded-2xl border p-4 space-y-4"
                  style={{ borderColor: passTheme.borderTint }}
                >

                  <div>

                    <p
                      className="text-[9px] font-black tracking-widest uppercase"
                      style={{ color: passTheme.primary }}
                    >
                      REGISTERED ATTENDEE
                    </p>

                    <p className="text-sm font-black text-slate-900 mt-1">
                      {registration?.full_name}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1 break-all">
                      {registration?.email}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1">
                      {registration?.class_semester}
                    </p>

                  </div>

                  <div
                    className="border-t pt-3"
                    style={{ borderColor: passTheme.borderTint }}
                  >

                    <p
                      className="text-[9px] font-black tracking-widest uppercase"
                      style={{ color: passTheme.primary }}
                    >
                      EVENT COORDINATORS
                    </p>

                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {coordinatorNames}
                    </p>

                    {coordinatorPhone && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Ph: {coordinatorPhone}
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {/* Important Notice */}

              <div className="px-5 pt-5 pb-6 text-center">

                <div className="flex justify-center items-center gap-2">

                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: passTheme.primary }}
                  />

                  <p
                    className="text-[10px] font-black tracking-wide uppercase"
                    style={{ color: passTheme.primaryDark }}
                  >
                    SAVE THIS PASS • SHOW AT ENTRY DESK
                  </p>

                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: passTheme.primary }}
                  />

                </div>

                <p className="text-[9px] text-slate-400 mt-2">
                  This pass is issued specifically to the registered participant.
                </p>

              </div>

              {/* Bottom Theme Strip */}

              <div
                className="h-3 w-full"
                style={{ backgroundColor: passTheme.primary }}
              />

            </div>

            {/* Action Buttons */}

            <div className="max-w-[410px] mx-auto space-y-3">

              <div className="grid grid-cols-2 gap-2">

                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="h-11 rounded-xl gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Pass
                </Button>

                <Button
                  variant="outline"
                  disabled={downloadingPass}
                  onClick={handleDownloadTicket}
                  className="h-11 rounded-xl gap-2 text-xs"
                >

                  {downloadingPass ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}

                  Pass Image

                </Button>

              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">

                <Button
                  disabled={downloadingPdf}
                  onClick={handleDownloadPdfTicket}
                  className="h-11 rounded-xl text-xs font-bold text-white gap-2"
                  style={{ backgroundColor: passTheme.primary }}
                >

                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}

                  Download PDF Ticket

                </Button>

                <Button
                  onClick={onClose}
                  className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
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
