import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  QrCode,
  Clock,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Loader2,
  Check,
  Copy,
  Filter,
  Camera,
  CameraOff,
  Upload,
  UserCheck,
  UserX,
  Volume2,
  Award,
  ExternalLink,
  Send,
  FileCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getEventRegistrations, checkInAttendee, updateAttendeeAttendance, updateEventAdmin } from "@/lib/adminService";
import { resendRegistrationTicket, sendParticipantCertificate } from "@/lib/emailService";
import { generateTicketPdf } from "@/lib/passGenerator";
import { generateAttendeeCertificate } from "@/lib/certificateGenerator";
import QRCode from "qrcode";
import type { EventItem, EventRegistration } from "@/types";

interface EventAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export const EventAttendeesModal: React.FC<EventAttendeesModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked_in" | "pending">("all");

  // Camera QR Scanner states
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);

  // Quick check-in input
  const [quickCode, setQuickCode] = useState("");
  const [checkInMsg, setCheckInMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Email & Certificate States
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  const [sendingCertId, setSendingCertId] = useState<string | null>(null);
  const [bulkSendingCerts, setBulkSendingCerts] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState(event?.certificate_drive_link || "");
  const [updatingDriveLink, setUpdatingDriveLink] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRegistrations = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const data = await getEventRegistrations(event.id);
      setRegistrations(data);
    } catch (err) {
      console.error("Error loading event registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      loadRegistrations();
      setCheckInMsg(null);
      setActionAlert(null);
      setQuickCode("");
      setSearch("");
      setIsScanningCamera(false);
      setDriveLinkInput(event.certificate_drive_link || "");
    } else {
      stopCameraScanner();
    }
  }, [isOpen, event?.id]);

  const handleResendTicketEmail = async (reg: EventRegistration) => {
    if (!event) return;
    setResendingEmailId(reg.id);
    setActionAlert(null);
    try {
      const res = await resendRegistrationTicket(reg, event);
      if (res.success) {
        setActionAlert({
          type: "success",
          text: `Ticket pass successfully sent to ${reg.email}!`,
        });
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? { ...r, email_status: "sent", email_sent_at: new Date().toISOString(), email_error: null }
              : r
          )
        );
      } else {
        setActionAlert({
          type: "error",
          text: res.error || `Could not deliver ticket to ${reg.email}`,
        });
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? { ...r, email_status: "failed", email_error: res.error }
              : r
          )
        );
      }
    } catch (err: any) {
      setActionAlert({ type: "error", text: err.message || "Failed to resend ticket email." });
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleDownloadParticipantTicket = async (reg: EventRegistration) => {
    if (!event) return;
    setDownloadingTicketId(reg.id);
    try {
      const qrPayload = JSON.stringify({
        ticket_code: reg.ticket_code,
        event_id: reg.event_id,
        event_title: event.title,
        attendee: reg.full_name,
        email: reg.email,
        timestamp: reg.created_at,
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const { pdfDataUri, filename } = await generateTicketPdf({
        eventTitle: event.title,
        startDate: event.start_date,
        venue: event.venue,
        attendeeName: reg.full_name,
        attendeeEmail: reg.email,
        attendeePhone: reg.phone,
        classSemester: reg.class_semester,
        ticketCode: reg.ticket_code,
        qrDataUrl: qrDataUrl,
        coordinator1Name: event.coordinator1_name || event.coordinator_name || "FOSS Chapter Lead",
        coordinator1Phone: event.coordinator1_phone || event.coordinator_phone || "",
        coordinator2Name: event.coordinator2_name || "",
        coordinator2Phone: event.coordinator2_phone || "",
        eventId: event.id,
        eventSlug: event.slug,
      });

      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = filename;
      link.click();
    } catch (err: any) {
      console.error("Failed to download attendee ticket PDF:", err);
      alert("Failed to generate ticket PDF. Please try again.");
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const handleDownloadSingleCertificate = async (reg: EventRegistration) => {
    if (!event) return;
    if (!reg.checked_in) {
      alert("Only attended participants (marked Present) can receive a certificate.");
      return;
    }
    setGeneratingCertId(reg.id);
    try {
      const cert = await generateAttendeeCertificate({ event, attendee: reg });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(cert.pdfBlob);
      link.download = cert.filename;
      link.click();
    } catch (err: any) {
      alert(err.message || "Failed to generate certificate.");
    } finally {
      setGeneratingCertId(null);
    }
  };

  const handleSendCertificateEmail = async (reg: EventRegistration) => {
    if (!event) return;
    if (!reg.checked_in) {
      const confirmSend = window.confirm(
        `${reg.full_name} is currently not marked Present. Do you want to mark them Present and send their certificate to ${reg.email}?`
      );
      if (!confirmSend) return;
      await updateAttendeeAttendance(reg.id, true);
      reg.checked_in = true;
    }

    setSendingCertId(reg.id);
    setActionAlert(null);
    try {
      const res = await sendParticipantCertificate(reg, event);
      if (res.success) {
        setActionAlert({
          type: "success",
          text: `Certificate successfully sent to ${reg.email}!`,
        });
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? {
                  ...r,
                  checked_in: true,
                  certificate_issued: true,
                  certificate_issued_at: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        setActionAlert({
          type: "error",
          text: res.error || `Could not deliver certificate to ${reg.email}`,
        });
      }
    } catch (err: any) {
      setActionAlert({
        type: "error",
        text: err.message || "Failed to send certificate email.",
      });
    } finally {
      setSendingCertId(null);
    }
  };

  const handleSendAllCertificates = async () => {
    if (!event) return;
    const attended = registrations.filter((r) => r.checked_in);
    if (attended.length === 0) {
      alert("No attendees are marked present yet. Please mark attendance first.");
      return;
    }

    const confirmSend = window.confirm(
      `Send official participation certificates via email to all ${attended.length} attended participant(s)?`
    );
    if (!confirmSend) return;

    setBulkSendingCerts(true);
    let successCount = 0;
    let failCount = 0;

    for (const attendee of attended) {
      try {
        const res = await sendParticipantCertificate(attendee, event);
        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setBulkSendingCerts(false);
    loadRegistrations();
    setActionAlert({
      type: successCount > 0 ? "success" : "error",
      text: `Batch Certificate dispatch: ${successCount} sent to registered emails${
        failCount > 0 ? `, ${failCount} failed.` : "."
      }`,
    });
  };

  const handleSaveDriveLink = async () => {
    if (!event) return;
    setUpdatingDriveLink(true);
    try {
      await updateEventAdmin(event.id, { certificate_drive_link: driveLinkInput.trim() });
      event.certificate_drive_link = driveLinkInput.trim();
      setActionAlert({ type: "success", text: "Google Drive folder link saved successfully!" });
    } catch (err: any) {
      setActionAlert({ type: "error", text: err.message || "Failed to save Drive link." });
    } finally {
      setUpdatingDriveLink(false);
    }
  };

  // Clean up camera on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Error stopping camera scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
    const container = document.getElementById("html5-qr-reader");
    if (container) {
      container.innerHTML = "";
    }
    setIsScanningCamera(false);
    setCameraError("");
  };

  const startCameraScanner = async () => {
    setCameraError("");
    setIsScanningCamera(true);

    // Give DOM a tick to render element
    setTimeout(async () => {
      try {
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              await html5QrCodeRef.current.stop();
            }
            await html5QrCodeRef.current.clear();
          } catch {}
          html5QrCodeRef.current = null;
        }

        const qrElement = document.getElementById("html5-qr-reader");
        if (!qrElement) return;
        qrElement.innerHTML = "";

        const scanner = new Html5Qrcode("html5-qr-reader");
        html5QrCodeRef.current = scanner;

        const qrConfig = {
          fps: 10,
          qrbox: (w: number, h: number) => {
            const edge = Math.floor(Math.min(w, h) * 0.75);
            return { width: Math.max(edge, 160), height: Math.max(edge, 160) };
          },
        };

        const onScanSuccess = (decodedText: string) => {
          handleDecodedCode(decodedText);
        };

        let started = false;

        // Try getting cameras list first
        try {
          const cameras = await Html5Qrcode.getCameras().catch(() => []);
          if (cameras && cameras.length > 0) {
            const backCam = cameras.find((c) =>
              /back|rear|environment|facing\s*back/i.test(c.label)
            );
            const targetCam = backCam ? backCam.id : cameras[0].id;
            await scanner.start(targetCam, qrConfig, onScanSuccess, () => {});
            started = true;
          }
        } catch (camErr) {
          console.warn("Camera enum start failed:", camErr);
        }

        if (!started) {
          try {
            await scanner.start({ facingMode: "environment" }, qrConfig, onScanSuccess, () => {});
            started = true;
          } catch (envErr) {
            console.warn("Environment camera failed, falling back to user/webcam:", envErr);
            await scanner.start({ facingMode: "user" }, qrConfig, onScanSuccess, () => {});
            started = true;
          }
        }
      } catch (err: any) {
        console.error("Failed to start camera scanner:", err);
        let msg = err?.message || "Could not access camera. Please check camera permissions.";
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          msg = "Camera permission was denied. Please allow camera permissions in browser site settings.";
        } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
          msg = "No camera hardware detected on this device.";
        }
        setCameraError(msg);
        setIsScanningCamera(false);
      }
    }, 150);
  };

  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    try {
      setCheckingIn(true);
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        const qrElement = document.getElementById("html5-qr-reader");
        if (qrElement) qrElement.innerHTML = "";
        scanner = new Html5Qrcode("html5-qr-reader");
        html5QrCodeRef.current = scanner;
      }
      const decoded = await scanner.scanFile(file, false);
      if (decoded) {
        await handleDecodedCode(decoded);
      }
    } catch (err: any) {
      setCheckInMsg({
        type: "error",
        text: "Could not read QR code from image. Please ensure image is well-lit and QR code is sharp.",
      });
    } finally {
      setCheckingIn(false);
      e.target.value = "";
    }
  };

  const handleDecodedCode = async (decodedText: string) => {
    if (!event) return;
    let code = decodedText.trim();

    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.ticket_code) {
        code = parsed.ticket_code;
      }
    } catch {}

    const now = Date.now();
    if (isProcessingScanRef.current) return;
    if (lastScannedCodeRef.current === code && now - lastScanTimeRef.current < 3500) {
      return;
    }

    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = code;
    lastScanTimeRef.current = now;

    try {
      const res = await checkInAttendee(code, event.id);
      if (res.success && res.registration) {
        playBeepSound();
        setCheckInMsg({
          type: "success",
          text: `Verified & Present: ${res.registration.full_name} (${res.registration.ticket_code})`,
        });
        setRegistrations((prev) =>
          prev.map((r) => (r.id === res.registration!.id ? res.registration! : r))
        );
      } else {
        setCheckInMsg({
          type: "error",
          text: res.error || `Ticket ${code} not found for this event.`,
        });
      }
    } catch (err: any) {
      setCheckInMsg({ type: "error", text: err.message || "Error processing QR ticket." });
    } finally {
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1000);
    }
  };

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim() || !event) return;

    setCheckingIn(true);
    setCheckInMsg(null);
    try {
      const res = await checkInAttendee(quickCode.trim(), event.id);
      if (res.success && res.registration) {
        playBeepSound();
        setCheckInMsg({
          type: "success",
          text: `Verified & Present: ${res.registration.full_name} (${res.registration.ticket_code})`,
        });
        setQuickCode("");
        setRegistrations((prev) =>
          prev.map((r) => (r.id === res.registration!.id ? res.registration! : r))
        );
      } else {
        setCheckInMsg({
          type: "error",
          text: res.error || "Ticket code not found for this event.",
        });
      }
    } catch (err: any) {
      setCheckInMsg({ type: "error", text: err.message || "Failed to check in attendee." });
    } finally {
      setCheckingIn(false);
    }
  };

  // Direct manual check-in without QR code
  const handleToggleAttendance = async (reg: EventRegistration, makePresent: boolean) => {
    if (!event) return;
    try {
      const res = await updateAttendeeAttendance(reg.id, makePresent);
      if (res.success && res.registration) {
        if (makePresent) playBeepSound();
        setRegistrations((prev) =>
          prev.map((r) => (r.id === res.registration!.id ? res.registration! : r))
        );
        setCheckInMsg({
          type: "success",
          text: makePresent
            ? `Marked Present: ${res.registration.full_name}`
            : `Marked Absent: ${res.registration.full_name}`,
        });
      }
    } catch (err) {
      console.error("Error setting attendance:", err);
    }
  };

  const copyTicket = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    if (!event || registrations.length === 0) return;

    const headers = [
      "Ticket Code",
      "Full Name",
      "Email",
      "Phone",
      "Class/Semester",
      "Attendance Status",
      "Checked In At",
      "Registration Date",
      "Custom Responses",
    ];

    const rows = registrations.map((r) => [
      `"${r.ticket_code}"`,
      `"${r.full_name}"`,
      `"${r.email}"`,
      `"${r.phone || ""}"`,
      `"${r.class_semester || ""}"`,
      r.checked_in ? "Present (Checked In)" : "Absent (Not Checked In)",
      r.checked_in_at ? `"${formatDate(r.checked_in_at)}"` : '""',
      `"${formatDate(r.created_at)}"`,
      `"${JSON.stringify(r.responses || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance-${event.slug || "event"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.ticket_code.toLowerCase().includes(q) ||
      (r.phone && r.phone.toLowerCase().includes(q)) ||
      (r.class_semester && r.class_semester.toLowerCase().includes(q));

    if (filterStatus === "checked_in") return matchesSearch && r.checked_in;
    if (filterStatus === "pending") return matchesSearch && !r.checked_in;
    return matchesSearch;
  });

  const totalRegistered = registrations.length;
  const totalCheckedIn = registrations.filter((r) => r.checked_in).length;

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 bg-white rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Attendance & Check-In Desk</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                <span>Scan camera QR pass, enter ticket code, or mark student attendance manually without QR.</span>
                {event.coordinator_name && (
                  <span className="text-emerald-700 font-semibold">• Coordinator: {event.coordinator_name}</span>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isScanningCamera ? "default" : "outline"}
                size="sm"
                onClick={isScanningCamera ? stopCameraScanner : startCameraScanner}
                className={`h-9 text-xs rounded-xl gap-1.5 font-bold ${
                  isScanningCamera
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                {isScanningCamera ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Scan with Camera</span>
                  </>
                )}
              </Button>

              <label
                className="h-9 px-3 text-xs rounded-xl gap-1.5 font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center cursor-pointer transition-colors"
                title="Scan QR code from saved invitation pass image file"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Upload Pass</span>
                <span className="sm:hidden">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanImageFile}
                />
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={registrations.length === 0}
                className="h-9 text-xs rounded-xl gap-1.5 border-slate-200 text-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCertModalOpen(true)}
                className="h-9 text-xs rounded-xl gap-1.5 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold"
                title="Manage and download certificates for attended participants"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Certificates ({totalCheckedIn})</span>
              </Button>

              {event?.certificate_drive_link && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs rounded-xl gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold"
                >
                  <a
                    href={event.certificate_drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Coordinator Edit-Enabled Google Drive Folder"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Drive</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Live Camera Scanner Box */}
        {isScanningCamera && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold px-2">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 animate-pulse text-emerald-400" />
                <span>Camera Scanner Active — Point at Attendee QR Code</span>
              </span>
              <button
                onClick={stopCameraScanner}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Close Camera
              </button>
            </div>
            <div
              id="html5-qr-reader"
              className="max-w-xs mx-auto overflow-hidden rounded-2xl border-2 border-emerald-500 shadow-xl bg-black"
            />
            {cameraError && (
              <p className="text-xs text-rose-400 font-semibold">{cameraError}</p>
            )}
          </div>
        )}

        {/* Stats & Quick Check-In Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3">
          {/* Stats Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
              <p className="text-xl font-black text-slate-900">{totalRegistered}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Present</span>
              <p className="text-xl font-black text-emerald-600">{totalCheckedIn}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600">Pending</span>
              <p className="text-xl font-black text-amber-600">{totalRegistered - totalCheckedIn}</p>
            </div>
          </div>

          {/* Quick Code / Scanner Input */}
          <div className="md:col-span-2 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <QrCode className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Scan or type ticket code (e.g. CEPRN-X9K2P)"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                  className="pl-9 h-9 text-xs rounded-xl bg-white border-emerald-300 font-mono font-bold uppercase"
                />
              </div>
              <Button
                type="submit"
                disabled={checkingIn || !quickCode.trim()}
                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 w-full sm:w-auto"
              >
                {checkingIn ? "Checking..." : "Verify & Check-In"}
              </Button>
            </form>

            {checkInMsg && (
              <div
                className={`mt-2 p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  checkInMsg.type === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {checkInMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                )}
                <span>{checkInMsg.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search student by name, email, phone, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({totalRegistered})
            </button>
            <button
              onClick={() => setFilterStatus("checked_in")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === "checked_in"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Present ({totalCheckedIn})
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === "pending"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Pending ({totalRegistered - totalCheckedIn})
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
              actionAlert.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {actionAlert.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button
              onClick={() => setActionAlert(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Registrations & Attendance Table (With 1-click Manual Attendance) */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Ticket Code</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Class/Branch</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Email Delivery</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading attendees...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <p className="font-semibold text-slate-600">No registrations found</p>
                      <p className="text-[11px]">
                        {search ? "No attendee matched your search." : "No one has registered yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {reg.ticket_code}
                          </span>
                          <button
                            onClick={() => copyTicket(reg.ticket_code)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Copy Code"
                          >
                            {copiedCode === reg.ticket_code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{reg.full_name}</span>
                        {reg.checked_in && reg.checked_in_at && (
                          <span className="text-[10px] text-emerald-600 block">
                            Present at {formatDate(reg.checked_in_at)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <div className="truncate max-w-[170px]">{reg.email}</div>
                        {reg.phone && (
                          <div className="text-[11px] text-slate-400">{reg.phone}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {reg.class_semester || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {reg.checked_in ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            ✓ Present
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {reg.email_status === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Sent</span>
                            </span>
                          ) : reg.email_status === "failed" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                              title={reg.email_error || "Email delivery failed"}
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}

                          <button
                            onClick={() => handleResendTicketEmail(reg)}
                            disabled={resendingEmailId === reg.id}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Resend Ticket Email"
                          >
                            {resendingEmailId === reg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download PDF Ticket */}
                          <button
                            onClick={() => handleDownloadParticipantTicket(reg)}
                            disabled={downloadingTicketId === reg.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title="Download PDF Ticket"
                          >
                            {downloadingTicketId === reg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Certificate Download (Only for checked-in participants) */}
                          {reg.checked_in && (
                            <button
                              onClick={() => handleDownloadSingleCertificate(reg)}
                              disabled={generatingCertId === reg.id}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                              title="Download Attendance Certificate (Attended Only)"
                            >
                              {generatingCertId === reg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              ) : (
                                <Award className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Email Certificate directly to Registered Email / Gmail */}
                          <button
                            onClick={() => handleSendCertificateEmail(reg)}
                            disabled={sendingCertId === reg.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              reg.certificate_issued
                                ? "text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100"
                                : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            }`}
                            title={
                              reg.certificate_issued
                                ? `Certificate already issued — Click to resend email to ${reg.email}`
                                : `Email Official Certificate to ${reg.email}`
                            }
                          >
                            {sendingCertId === reg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Manual Attendance Toggle */}
                          {reg.checked_in ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAttendance(reg, false)}
                              className="h-7 px-2 text-[11px] font-bold rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Click to mark absent"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              <span>Absent</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleToggleAttendance(reg, true)}
                              className="h-7 px-2 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              title="Click to mark present without QR code"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span>Present</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUB-MODAL: CERTIFICATES FOR ATTENDED PARTICIPANTS ONLY */}
        {certModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Event Certificates</h4>
                    <p className="text-[11px] text-slate-500">
                      Issue verified certificates exclusively for attended participants.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCertModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Status Info */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Eligible (Checked In)
                  </span>
                  <p className="text-lg font-black text-amber-950">
                    {totalCheckedIn} of {totalRegistered} Participants
                  </p>
                </div>
                <Badge className="bg-amber-600 text-white font-bold text-xs">
                  {totalCheckedIn > 0 ? "Ready to Issue" : "No Attendees Yet"}
                </Badge>
              </div>

              {/* Coordinator Google Drive Link Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Coordinator Edit-Enabled Google Drive Link</span>
                  {event?.certificate_drive_link && (
                    <a
                      href={event.certificate_drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Folder</span>
                    </a>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveLinkInput}
                    onChange={(e) => setDriveLinkInput(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    size="sm"
                    disabled={updatingDriveLink || driveLinkInput === (event?.certificate_drive_link || "")}
                    onClick={handleSaveDriveLink}
                    className="h-9 px-3 text-xs font-bold bg-slate-900 text-white rounded-xl shrink-0"
                  >
                    {updatingDriveLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Provide an edit-enabled Google Drive folder link so certificates can be stored and shared with attendees.
                </p>
              </div>

              {/* Batch Download / Generate All Attended Certificates */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 font-medium">
                  {event?.certificate_drive_link ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Google Drive sync active: destination folder will open automatically.
                    </span>
                  ) : (
                    <span>Provide a Drive link above to automatically sync files.</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCertModalOpen(false)}
                    className="h-9 text-xs rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    disabled={bulkSendingCerts || totalCheckedIn === 0}
                    onClick={handleSendAllCertificates}
                    className="h-9 px-3.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 shadow-sm"
                    title="Send official certificates to all present attendees' emails"
                  >
                    {bulkSendingCerts ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Email to All ({totalCheckedIn})</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={totalCheckedIn === 0}
                    onClick={async () => {
                      const attended = registrations.filter((r) => r.checked_in);
                      if (attended.length === 0) {
                        alert("No attendees are marked present yet.");
                        return;
                      }

                      // Automatically open the provided Google Drive folder
                      if (event?.certificate_drive_link) {
                        window.open(event.certificate_drive_link, "_blank", "noopener,noreferrer");
                      }

                      alert(`Starting generation for ${attended.length} attended participants. Files are synchronizing to your provided Google Drive.`);
                      for (const att of attended) {
                        try {
                          const cert = await generateAttendeeCertificate({ event: event!, attendee: att });
                          const link = document.createElement("a");
                          link.href = URL.createObjectURL(cert.pdfBlob);
                          link.download = cert.filename;
                          link.click();
                        } catch (e) {
                          console.error("Batch cert error:", e);
                        }
                      }
                    }}
                    className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>
                      {event?.certificate_drive_link
                        ? `Store to Drive & Download (${totalCheckedIn})`
                        : `Download Attended Certificates (${totalCheckedIn})`}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
