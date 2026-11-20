import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  Calendar,
  Users,
  Plus,
  Search,
  Edit2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  LogOut,
  Upload,
  UserCheck,
  UserX,
  Github,
  Linkedin,
  Mail,
  Megaphone,
  Shield,
  Eye,
  CalendarDays,
  ChevronRight,
  QrCode,
  Link2,
  Check,
  Camera,
  CameraOff,
  Download,
  Copy,
  Phone,
  Filter,
  Volume2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ticket,
  Award,
  Send,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getAllEventsAdmin,
  createEventAdmin,
  updateEventAdmin,
  uploadStorageFile,
  getAllExecomAdmin,
  getAllAnnouncementsAdmin,
  getEventRegistrations,
  checkInAttendee,
  updateAttendeeAttendance,
} from "@/lib/adminService";
import {
  getTodayActivities,
  getUpcomingActivities,
  getAllActivities,
} from "@/lib/activityService";
import { ActivityCalendar, getCategoryBadgeClasses } from "@/components/calendar/ActivityCalendar";
import { formatDate } from "@/lib/utils";
import { EventRegistrationQuestionsBuilder } from "@/components/events/EventRegistrationQuestionsBuilder";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import { resendRegistrationTicket, sendParticipantCertificate } from "@/lib/emailService";
import { generateTicketPdf } from "@/lib/passGenerator";
import { generateAttendeeCertificate, generateAllCertificatesZip } from "@/lib/certificateGenerator";
import QRCode from "qrcode";
import type {
  EventItem,
  ExecomMember,
  AnnouncementItem,
  PublicationStatus,
  RegistrationStatus,
  RegistrationMode,
  RegistrationQuestion,
  ActivityItem,
  EventRegistration,
} from "@/types";

export type ExecomDashboardTab =
  | "events"
  | "scanner"
  | "participants"
  | "calendar"
  | "team"
  | "announcements";

function playBeepSound(type: "success" | "error" = "success") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(type === "success" ? 880 : 330, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export const ExecomDashboard: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: "events" | "scanner" | "participants" | "calendar" | "team" | "announcements"
  const urlTab = searchParams.get("tab") as ExecomDashboardTab | null;
  const validTabs: ExecomDashboardTab[] = [
    "events",
    "scanner",
    "participants",
    "calendar",
    "team",
    "announcements",
  ];
  const [activeTab, setActiveTabState] = useState<ExecomDashboardTab>(
    urlTab && validTabs.includes(urlTab) ? urlTab : "events"
  );

  const setActiveTab = (tab: ExecomDashboardTab) => {
    setActiveTabState(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as ExecomDashboardTab | null;
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams]);

  // Activities State
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityItem[]>([]);
  const [upcomingActivitiesCount, setUpcomingActivitiesCount] = useState<number>(0);

  // Events State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");

  // ExeCom Members State (Read-only directory for ExeCom coordinators)
  const [execomMembers, setExecomMembers] = useState<ExecomMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Announcements State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Event Modal States (Creation & Editing)
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [attendeesEvent, setAttendeesEvent] = useState<EventItem | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [eventError, setEventError] = useState("");

  const [eventForm, setEventForm] = useState({
    title: "",
    slug: "",
    description: "",
    venue: "",
    start_date: "",
    end_date: "",
    cover_image: "",
    publication_status: (isAdmin ? "published" : "pending_approval") as PublicationStatus,
    registration_status: "open" as RegistrationStatus,
    registration_mode: "onsite" as RegistrationMode,
    gform_url: "",
    registration_questions: [] as RegistrationQuestion[],
    coordinator_name: "",
    coordinator_phone: "",
    coordinator1_name: "",
    coordinator1_id: "",
    coordinator1_phone: "",
    coordinator2_name: "",
    coordinator2_id: "",
    coordinator2_phone: "",
    coordinator2_type: "execom" as "execom" | "external",
    volunteer1_name: "",
    volunteer1_id: "" as string | null,
    volunteer1_type: "execom" as "execom" | "external",
    volunteer2_name: "",
    volunteer2_id: "" as string | null,
    volunteer2_type: "execom" as "execom" | "external",
    whatsapp_group_link: "",
    certificate_drive_link: "",
    certificate_template_url: "",
    certificate_enabled: true,
    created_by: user?.full_name || user?.email || "ExeCom Coordinator",
    created_by_id: user?.id || null,
  });

  const canEditEvent = (evt: EventItem): boolean => {
    if (isAdmin) return true;
    if (!user) return false;

    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.full_name || "").toLowerCase().trim();
    const userId = user.id;

    // 1. Event Creator
    if (evt.created_by_id && evt.created_by_id === userId) return true;
    if (evt.created_by && (evt.created_by.toLowerCase().trim() === userEmail || evt.created_by.toLowerCase().trim() === userName)) return true;

    // 2. Coordinator 1 (Must be ExeCom member)
    if (evt.coordinator1_id && evt.coordinator1_id === userId) return true;
    if (evt.coordinator1_name && (evt.coordinator1_name.toLowerCase().trim() === userName || evt.coordinator1_name.toLowerCase().trim() === userEmail)) return true;

    // 3. Coordinator 2 (ExeCom or Non-ExeCom)
    if (evt.coordinator2_id && evt.coordinator2_id === userId) return true;
    if (evt.coordinator2_name && (evt.coordinator2_name.toLowerCase().trim() === userName || evt.coordinator2_name.toLowerCase().trim() === userEmail)) return true;

    // Legacy fallback: coordinator_name contains userName
    if (evt.coordinator_name && userName && evt.coordinator_name.toLowerCase().includes(userName)) return true;

    return false;
  };

  const canManageEventAttendees = (evt?: EventItem | null): boolean => {
    if (isAdmin) return true;
    if (!evt || !user) return false;

    // 1. Coordinators, Creator & Admins
    if (canEditEvent(evt)) return true;

    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.full_name || "").toLowerCase().trim();
    const userId = user.id;

    // 2. Volunteer 1 (Assigned from event creation/editing)
    if (evt.volunteer1_id && evt.volunteer1_id === userId) return true;
    if (
      evt.volunteer1_name &&
      (evt.volunteer1_name.toLowerCase().trim() === userName ||
        evt.volunteer1_name.toLowerCase().trim() === userEmail)
    ) {
      return true;
    }

    // 3. Volunteer 2 (Assigned from event creation/editing)
    if (evt.volunteer2_id && evt.volunteer2_id === userId) return true;
    if (
      evt.volunteer2_name &&
      (evt.volunteer2_name.toLowerCase().trim() === userName ||
        evt.volunteer2_name.toLowerCase().trim() === userEmail)
    ) {
      return true;
    }

    return false;
  };

  const canApproveEvent = (evt: EventItem): boolean => {
    if (isAdmin) return true;
    if (!user) return false;
    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.full_name || "").toLowerCase().trim();
    const userId = user.id;

    // Assigned Coordinator 1
    if (evt.coordinator1_id && evt.coordinator1_id === userId) return true;
    if (evt.coordinator1_name && (evt.coordinator1_name.toLowerCase().trim() === userName || evt.coordinator1_name.toLowerCase().trim() === userEmail)) return true;

    // Assigned Coordinator 2
    if (evt.coordinator2_id && evt.coordinator2_id === userId) return true;
    if (evt.coordinator2_name && (evt.coordinator2_name.toLowerCase().trim() === userName || evt.coordinator2_name.toLowerCase().trim() === userEmail)) return true;

    // Event Creator
    if (evt.created_by_id && evt.created_by_id === userId) return true;
    if (evt.created_by && (evt.created_by.toLowerCase().trim() === userName || evt.created_by.toLowerCase().trim() === userEmail)) return true;

    return false;
  };

  // --------------------------------------------------------------------------
  // Dedicated Scanner Tab State
  // --------------------------------------------------------------------------
  const [selectedScanEventId, setSelectedScanEventId] = useState<string>("");
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: "success" | "warning" | "error";
    title: string;
    message: string;
    registration?: EventRegistration;
  } | null>(null);
  const [recentScans, setRecentScans] = useState<{
    registration: EventRegistration;
    timestamp: string;
    isNew: boolean;
  }[]>([]);
  const html5QrScannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);

  // --------------------------------------------------------------------------
  // Dedicated Participants Tab State
  // --------------------------------------------------------------------------
  const [selectedParticipantEventId, setSelectedParticipantEventId] = useState<string>("");
  const [participantRegistrations, setParticipantRegistrations] = useState<EventRegistration[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatusFilter, setParticipantStatusFilter] = useState<"all" | "checked_in" | "pending">("all");
  const [togglingAttendanceId, setTogglingAttendanceId] = useState<string | null>(null);
  const [copiedTicketCode, setCopiedTicketCode] = useState<string | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  const [participantAlert, setParticipantAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResendParticipantEmail = async (reg: EventRegistration) => {
    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
    if (!curEvt) return;
    setResendingEmailId(reg.id);
    setParticipantAlert(null);
    try {
      const res = await resendRegistrationTicket(reg, curEvt);
      if (res.success) {
        setParticipantAlert({
          type: "success",
          text: `Ticket successfully sent to ${reg.email}!`,
        });
        setParticipantRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? { ...r, email_status: "sent", email_sent_at: new Date().toISOString(), email_error: null }
              : r
          )
        );
      } else {
        setParticipantAlert({
          type: "error",
          text: res.error || `Could not deliver ticket to ${reg.email}`,
        });
        setParticipantRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? { ...r, email_status: "failed", email_error: res.error }
              : r
          )
        );
      }
    } catch (err: any) {
      setParticipantAlert({ type: "error", text: err?.message || "Failed to resend ticket." });
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleDownloadSingleTicket = async (reg: EventRegistration) => {
    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
    if (!curEvt) return;
    setDownloadingTicketId(reg.id);
    try {
      const qrPayload = JSON.stringify({
        ticket_code: reg.ticket_code,
        event_id: reg.event_id,
        event_title: curEvt.title,
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
        eventTitle: curEvt.title,
        startDate: curEvt.start_date,
        venue: curEvt.venue,
        attendeeName: reg.full_name,
        attendeeEmail: reg.email,
        attendeePhone: reg.phone,
        classSemester: reg.class_semester,
        ticketCode: reg.ticket_code,
        qrDataUrl: qrDataUrl,
        coordinator1Name: curEvt.coordinator1_name || curEvt.coordinator_name || "FOSS Chapter Lead",
        coordinator1Phone: curEvt.coordinator1_phone || curEvt.coordinator_phone || "",
        coordinator2Name: curEvt.coordinator2_name || "",
        coordinator2Phone: curEvt.coordinator2_phone || "",
        eventId: curEvt.id,
        eventSlug: curEvt.slug,
      });

      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = filename;
      link.click();
    } catch (err: any) {
      alert("Failed to download PDF ticket: " + (err?.message || ""));
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const handleDownloadSingleCert = async (reg: EventRegistration) => {
    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
    if (!curEvt) return;
    if (!reg.checked_in) {
      alert("Only attended participants (marked Present) can receive a certificate.");
      return;
    }
    setGeneratingCertId(reg.id);
    try {
      const cert = await generateAttendeeCertificate({ event: curEvt, attendee: reg });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(cert.pdfBlob);
      link.download = cert.filename;
      link.click();
    } catch (err: any) {
      alert(err?.message || "Failed to generate certificate.");
    } finally {
      setGeneratingCertId(null);
    }
  };

  const [sendingCertId, setSendingCertId] = useState<string | null>(null);
  const [bulkSendingCerts, setBulkSendingCerts] = useState(false);
  const [mobileTabDropdownOpen, setMobileTabDropdownOpen] = useState(false);
  const [mobileFloatingMenuOpen, setMobileFloatingMenuOpen] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState("");
  const [specificCertModalOpen, setSpecificCertModalOpen] = useState(false);
  const [targetAttendeeForCert, setTargetAttendeeForCert] = useState<EventRegistration | null>(null);
  const [specificCertTargetEmail, setSpecificCertTargetEmail] = useState("");

  const handleOpenSendSpecificCert = (reg: EventRegistration) => {
    setTargetAttendeeForCert(reg);
    setSpecificCertTargetEmail(reg.email || "");
    setSpecificCertModalOpen(true);
  };

  const handleSendCertToSpecificEmail = async () => {
    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
    if (!curEvt || !targetAttendeeForCert) return;
    const reg = targetAttendeeForCert;
    const dest = specificCertTargetEmail.trim();
    if (!dest) {
      alert("Please enter a valid recipient Gmail address.");
      return;
    }

    if (!reg.checked_in) {
      await updateAttendeeAttendance(reg.id, true);
      reg.checked_in = true;
    }

    setSendingCertId(reg.id);
    setSpecificCertModalOpen(false);
    setParticipantAlert({
      type: "success",
      text: `Dispatching certificate to ${dest}...`,
    });

    try {
      const res = await sendParticipantCertificate(reg, curEvt, dest);
      if (res.success) {
        setParticipantAlert({
          type: "success",
          text: res.details || `Certificate successfully delivered to ${dest}!`,
        });
        setParticipantRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? {
                  ...r,
                  certificate_issued: true,
                  certificate_issued_at: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        setParticipantAlert({
          type: "error",
          text: res.error || `Could not deliver certificate to ${dest}`,
        });
      }
    } catch (err: any) {
      setParticipantAlert({
        type: "error",
        text: err?.message || "Failed to send certificate email.",
      });
    } finally {
      setSendingCertId(null);
      setTargetAttendeeForCert(null);
    }
  };

  const handleDownloadAllCertificatesZip = async (curEvt: EventItem) => {
    const attended = participantRegistrations.filter((r) => r.checked_in);
    if (attended.length === 0) {
      alert("No attendees are marked present yet. Mark attendance first to download certificates.");
      return;
    }

    setDownloadingZip(true);
    setZipProgress(`Preparing ZIP package for ${attended.length} attendee(s)...`);
    try {
      const result = await generateAllCertificatesZip(curEvt, participantRegistrations, (cur, total, name) => {
        setZipProgress(`Generating certificate ${cur}/${total}: ${name}`);
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(result.zipBlob);
      link.download = result.filename;
      link.click();
      setParticipantAlert({
        type: "success",
        text: `Successfully bundled and downloaded ${result.count} certificates as ZIP archive!`,
      });
    } catch (err: any) {
      setParticipantAlert({
        type: "error",
        text: err?.message || "Failed to generate certificates ZIP.",
      });
    } finally {
      setDownloadingZip(false);
      setZipProgress("");
    }
  };

  const handleSendCertificateToParticipant = async (reg: EventRegistration) => {
    handleOpenSendSpecificCert(reg);
  };

  const handleBatchEmailCertificates = async (curEvt: EventItem) => {
    const attended = participantRegistrations.filter((r) => r.checked_in);
    if (attended.length === 0) {
      alert("No checked-in participants found for this event.");
      return;
    }
    if (!confirm(`Are you sure you want to email official certificates to all ${attended.length} attended participants?`)) {
      return;
    }
    setBulkSendingCerts(true);
    let successCount = 0;
    let failCount = 0;
    for (const attendee of attended) {
      try {
        const res = await sendParticipantCertificate(attendee, curEvt);
        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setBulkSendingCerts(false);
    setParticipantAlert({
      type: successCount > 0 ? "success" : "error",
      text: `Batch certificate email complete: ${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed.` : "."}`,
    });
  };

  const handleApproveEvent = async (evt: EventItem) => {
    if (!canApproveEvent(evt)) {
      setEventError("Permission denied: Only event coordinators and administrators can approve this event.");
      return;
    }
    try {
      await updateEventAdmin(evt.id, {
        publication_status: "published",
        approved_by: user?.full_name || user?.email || (isAdmin ? "Admin" : "Coordinator"),
        approved_at: new Date().toISOString(),
      });
      await loadData();
    } catch (err: any) {
      setEventError(err.message || "Failed to approve event.");
    }
  };

  const loadParticipantRegistrations = async (eventId: string) => {
    if (!eventId) return;
    const curEvt = events.find((e) => e.id === eventId);
    if (!isAdmin && curEvt && !canManageEventAttendees(curEvt)) {
      setParticipantRegistrations([]);
      return;
    }
    setLoadingParticipants(true);
    try {
      const data = await getEventRegistrations(eventId);
      setParticipantRegistrations(data);
    } catch (err) {
      console.error("Error loading event registrations:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    if (selectedParticipantEventId) {
      loadParticipantRegistrations(selectedParticipantEventId);
    }
  }, [selectedParticipantEventId]);

  const handleToggleAttendance = async (reg: EventRegistration) => {
    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
    if (!isAdmin && (!curEvt || !canManageEventAttendees(curEvt))) {
      alert("Permission denied: Only the assigned event coordinators or administrators can mark attendance.");
      return;
    }
    setTogglingAttendanceId(reg.id);
    try {
      const nextChecked = !reg.checked_in;
      const res = await updateAttendeeAttendance(reg.id, nextChecked);
      if (res.success && res.registration) {
        setParticipantRegistrations((prev) =>
          prev.map((r) => (r.id === reg.id ? res.registration! : r))
        );
      }
    } catch (err) {
      console.error("Error toggling attendance:", err);
    } finally {
      setTogglingAttendanceId(null);
    }
  };

  const handleExportCsv = () => {
    const curEvent = events.find((e) => e.id === selectedParticipantEventId);
    if (!curEvent) return;
    if (participantRegistrations.length === 0) {
      alert("No registered participants found to export.");
      return;
    }

    const baseHeaders = [
      "Ticket Code",
      "Full Name",
      "Email",
      "Phone",
      "Class / Semester",
      "Attendance Status",
      "Check-in Timestamp",
      "Registered At",
    ];
    const questionHeaders = (curEvent.registration_questions || []).map((q) => q.label);
    const headers = [...baseHeaders, ...questionHeaders];

    const rows = participantRegistrations.map((reg) => {
      const baseCols = [
        reg.ticket_code,
        `"${(reg.full_name || "").replace(/"/g, '""')}"`,
        reg.email,
        reg.phone || "",
        `"${(reg.class_semester || "").replace(/"/g, '""')}"`,
        reg.checked_in ? "Checked In" : "Pending",
        reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString() : "",
        reg.created_at ? new Date(reg.created_at).toLocaleString() : "",
      ];
      const questionCols = (curEvent.registration_questions || []).map((q) => {
        const ans = reg.responses?.[q.id] ?? "";
        return `"${String(ans).replace(/"/g, '""')}"`;
      });
      return [...baseCols, ...questionCols].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encoded = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encoded;
    a.download = `${(curEvent.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleProcessTicketCode = async (rawCode: string) => {
    let code = rawCode.trim();
    if (!code) return;

    // 1. Try parsing JSON if scanned from formatted QR pass
    try {
      if (code.startsWith("{") && code.endsWith("}")) {
        const parsed = JSON.parse(code);
        if (parsed.ticket_code) code = String(parsed.ticket_code).trim();
        else if (parsed.id) code = String(parsed.id).trim();
      }
    } catch {}

    // 2. Extract ticket parameter if query string or URL
    if (code.includes("ticket=") || code.includes("code=") || code.includes("ticket_code=")) {
      const match = code.match(/(?:ticket_code|ticket|code)=([A-Za-z0-9_-]+)/i);
      if (match) code = match[1].trim();
    }

    // 3. Scan cooldown protection
    const now = Date.now();
    if (isProcessingScanRef.current) return;
    if (lastScannedCodeRef.current === code && now - lastScanTimeRef.current < 3500) {
      return;
    }

    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = code;
    lastScanTimeRef.current = now;
    setVerifyingCode(true);

    try {
      if (selectedScanEventId && !isAdmin) {
        const targetEvt = events.find((e) => e.id === selectedScanEventId);
        if (targetEvt && !canManageEventAttendees(targetEvt)) {
          playBeepSound("error");
          setScanResult({
            type: "error",
            title: "Access Restricted",
            message: `Permission denied: You are not an assigned coordinator for "${targetEvt.title}". Only its coordinators or administrators can scan tickets.`,
          });
          setVerifyingCode(false);
          isProcessingScanRef.current = false;
          return;
        }
      }

      const res = await checkInAttendee(code, selectedScanEventId || undefined);
      if (res.success && res.registration) {
        const reg = res.registration;
        const targetEvt = events.find((e) => e.id === reg.event_id);
        if (!isAdmin && targetEvt && !canManageEventAttendees(targetEvt)) {
          playBeepSound("error");
          setScanResult({
            type: "error",
            title: "Access Restricted",
            message: `Permission denied: Ticket belongs to "${targetEvt.title}". Only its assigned coordinators can check in attendees.`,
          });
          setVerifyingCode(false);
          isProcessingScanRef.current = false;
          return;
        }

        const wasAlready =
          recentScans.some((s) => s.registration.id === reg.id) ||
          (reg.checked_in &&
            reg.checked_in_at &&
            Date.now() - new Date(reg.checked_in_at).getTime() > 12000);

        playBeepSound("success");
        setScanResult({
          type: wasAlready ? "warning" : "success",
          title: wasAlready ? "Already Checked In" : "Check-in Successful!",
          message: wasAlready
            ? `${reg.full_name} (${reg.ticket_code}) was already checked in at ${
                reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : "earlier"
              }.`
            : `${reg.full_name} (${reg.ticket_code}) verified and checked in!`,
          registration: reg,
        });

        setRecentScans((prev) => [
          {
            registration: reg,
            timestamp: new Date().toLocaleTimeString(),
            isNew: !wasAlready,
          },
          ...prev.slice(0, 19),
        ]);

        // Update participants state if loaded
        setParticipantRegistrations((prev) =>
          prev.map((r) => (r.id === reg.id ? reg : r))
        );
        setManualTicketCode("");
      } else {
        playBeepSound("error");
        setScanResult({
          type: "error",
          title: "Invalid Ticket",
          message: res.error || `Ticket "${code}" not found for this event.`,
        });
      }
    } catch (err: any) {
      playBeepSound("error");
      setScanResult({
        type: "error",
        title: "Scan Error",
        message: err.message || "Could not process ticket code.",
      });
    } finally {
      setVerifyingCode(false);
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1000);
    }
  };

  const startCameraScanner = async () => {
    setCameraError("");
    setIsScanningCamera(true);

    // Give DOM a tick to ensure reader div is mounted and clean
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (html5QrScannerRef.current) {
        try {
          if (html5QrScannerRef.current.isScanning) {
            await html5QrScannerRef.current.stop();
          }
          await html5QrScannerRef.current.clear();
        } catch {}
        html5QrScannerRef.current = null;
      }

      // Ensure target element is clean
      const container = document.getElementById("dashboard-camera-qr-reader");
      if (container) {
        container.innerHTML = "";
      }

      const scanner = new Html5Qrcode("dashboard-camera-qr-reader");
      html5QrScannerRef.current = scanner;

      const qrConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
          return { width: Math.max(edge, 160), height: Math.max(edge, 160) };
        },
      };

      const onScanSuccess = async (decodedText: string) => {
        await handleProcessTicketCode(decodedText);
      };

      let started = false;

      // Strategy 1: Attempt to enumerate camera devices
      try {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find((c) =>
            /back|rear|environment|facing\s*back/i.test(c.label)
          );
          const camId = backCam ? backCam.id : cameras[0].id;
          await scanner.start(camId, qrConfig, onScanSuccess, () => {});
          started = true;
        }
      } catch (camErr) {
        console.warn("Direct device scan start failed, falling back to facingMode:", camErr);
      }

      // Strategy 2: If devices couldn't be enumerated or started, try environment facingMode
      if (!started) {
        try {
          await scanner.start({ facingMode: "environment" }, qrConfig, onScanSuccess, () => {});
          started = true;
        } catch (envErr) {
          console.warn("facingMode: environment failed, falling back to user camera:", envErr);
          // Strategy 3: Desktop/webcam fallback with user facingMode
          await scanner.start({ facingMode: "user" }, qrConfig, onScanSuccess, () => {});
          started = true;
        }
      }
    } catch (err: any) {
      console.error("Camera scanner error:", err);
      let msg = err?.message || "Could not access device camera.";
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        msg = "Camera permission was denied. Please allow camera access in your browser site permissions.";
      } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
        msg = "No camera found on this device. Please connect a webcam or upload a QR image pass.";
      } else if (msg.includes("NotReadableError")) {
        msg = "Camera is currently occupied by another program or tab. Please close other camera apps and retry.";
      }
      setCameraError(msg);
      setIsScanningCamera(false);
    }
  };

  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVerifyingCode(true);
      let scanner = html5QrScannerRef.current;
      if (!scanner) {
        const container = document.getElementById("dashboard-camera-qr-reader");
        if (container) container.innerHTML = "";
        scanner = new Html5Qrcode("dashboard-camera-qr-reader");
        html5QrScannerRef.current = scanner;
      }
      const decoded = await scanner.scanFile(file, false);
      if (decoded) {
        await handleProcessTicketCode(decoded);
      }
    } catch (err: any) {
      playBeepSound("error");
      setScanResult({
        type: "error",
        title: "Image Scan Failed",
        message: "No readable QR code found in the uploaded image. Please ensure the invitation pass QR code is sharp and well-lit.",
      });
    } finally {
      setVerifyingCode(false);
      e.target.value = "";
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrScannerRef.current) {
      try {
        if (html5QrScannerRef.current.isScanning) {
          await html5QrScannerRef.current.stop();
        }
        await html5QrScannerRef.current.clear();
      } catch {}
      html5QrScannerRef.current = null;
    }
    const container = document.getElementById("dashboard-camera-qr-reader");
    if (container) {
      container.innerHTML = "";
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    if (activeTab !== "scanner") {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [activeTab]);

  const loadData = async () => {
    try {
      setEventsLoading(true);
      setMembersLoading(true);
      const [eventsData, teamData, announceData, upActs, allActs] = await Promise.all([
        getAllEventsAdmin().catch((e) => {
          console.warn("Failed loading events:", e);
          return [];
        }),
        getAllExecomAdmin().catch((e) => {
          console.warn("Failed loading execom:", e);
          return [];
        }),
        getAllAnnouncementsAdmin().catch((e) => {
          console.warn("Failed loading announcements:", e);
          return [];
        }),
        getUpcomingActivities(8).catch((e) => {
          console.warn("Failed loading upcoming activities:", e);
          return [];
        }),
        getAllActivities().catch((e) => {
          console.warn("Failed loading all activities:", e);
          return [];
        }),
      ]);
      setEvents(eventsData);
      setExecomMembers(teamData);
      setAnnouncements(announceData);
      setUpcomingActivities(upActs);
      setUpcomingActivitiesCount(upActs.length);

      if (eventsData.length > 0) {
        const userEvent =
          eventsData.find(
            (e) => canManageEventAttendees(e) && e.registration_mode !== "gform"
          ) ||
          (isAdmin
            ? eventsData.find((e) => e.registration_mode !== "gform") || eventsData[0]
            : null);

        if (userEvent) {
          setSelectedScanEventId((prev) => prev || userEvent.id);
          setSelectedParticipantEventId((prev) => prev || userEvent.id);
        } else {
          setSelectedScanEventId((prev) => prev || "");
          setSelectedParticipantEventId((prev) => prev || "");
        }
      }
    } catch (err) {
      console.error("Error loading ExeCom dashboard data:", err);
    } finally {
      setEventsLoading(false);
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    const myMember = execomMembers.find(
      (m) =>
        (user?.id && m.id === user.id) ||
        (user?.email && m.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
        (user?.full_name && m.full_name.toLowerCase() === user.full_name.toLowerCase())
    );

    setEventForm({
      title: "",
      slug: "",
      description: "",
      venue: "Campus Lab / Online",
      start_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 86400000 + 7200000).toISOString().slice(0, 16),
      cover_image: "",
      publication_status: isAdmin ? "published" : "pending_approval",
      registration_status: "open",
      registration_mode: "onsite",
      gform_url: "",
      registration_questions: [],
      coordinator_name: myMember ? myMember.full_name : user?.full_name || "",
      coordinator_phone: (myMember as any)?.phone_number || "",
      coordinator1_name: myMember ? myMember.full_name : "",
      coordinator1_id: myMember ? myMember.id : "",
      coordinator1_phone: (myMember as any)?.phone_number || "",
      coordinator2_name: "",
      coordinator2_id: "",
      coordinator2_phone: "",
      coordinator2_type: "execom",
      volunteer1_name: "",
      volunteer1_id: "",
      volunteer1_type: "execom",
      volunteer2_name: "",
      volunteer2_id: "",
      volunteer2_type: "execom",
      whatsapp_group_link: "",
      certificate_drive_link: "",
      certificate_template_url: "",
      certificate_enabled: true,
      created_by: user?.full_name || user?.email || "ExeCom Coordinator",
      created_by_id: user?.id || null,
    });
    setEventError("");
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: EventItem) => {
    if (!canEditEvent(evt)) {
      setEventError("Permission denied: Only event coordinators and administrators can edit this event.");
      return;
    }
    setEditingEvent(evt);

    // Robust matching for Coordinator 1
    const foundC1 = execomMembers.find(
      (m) =>
        (evt.coordinator1_id && m.id === evt.coordinator1_id) ||
        (evt.coordinator1_name && m.full_name.trim().toLowerCase() === evt.coordinator1_name.trim().toLowerCase()) ||
        (evt.coordinator_name && m.full_name.trim().toLowerCase() === evt.coordinator_name.trim().toLowerCase())
    );
    const c1Name = foundC1 ? foundC1.full_name : (evt.coordinator1_name || evt.coordinator_name || "");
    const c1Id = foundC1 ? foundC1.id : (evt.coordinator1_id || "");
    const c1Phone = evt.coordinator1_phone || evt.coordinator_phone || (foundC1 as any)?.phone_number || "";

    // Robust matching for Coordinator 2
    const foundC2 = execomMembers.find(
      (m) =>
        (evt.coordinator2_id && m.id === evt.coordinator2_id) ||
        (evt.coordinator2_name && m.full_name.trim().toLowerCase() === evt.coordinator2_name.trim().toLowerCase())
    );
    const c2Name = foundC2 ? foundC2.full_name : (evt.coordinator2_name || "");
    const c2Id = foundC2 ? foundC2.id : (evt.coordinator2_id || "");
    const c2Phone = evt.coordinator2_phone || (foundC2 as any)?.phone_number || "";
    const c2Type = foundC2 || (!evt.coordinator2_name && !evt.coordinator2_id) ? "execom" : "external";

    // Matching for Volunteers
    const foundV1 = execomMembers.find(
      (m) =>
        (evt.volunteer1_id && m.id === evt.volunteer1_id) ||
        (evt.volunteer1_name && m.full_name.trim().toLowerCase() === evt.volunteer1_name.trim().toLowerCase())
    );
    const foundV2 = execomMembers.find(
      (m) =>
        (evt.volunteer2_id && m.id === evt.volunteer2_id) ||
        (evt.volunteer2_name && m.full_name.trim().toLowerCase() === evt.volunteer2_name.trim().toLowerCase())
    );

    setEventForm({
      title: evt.title,
      slug: evt.slug,
      description: evt.description || "",
      venue: evt.venue || "",
      start_date: evt.start_date ? new Date(evt.start_date).toISOString().slice(0, 16) : "",
      end_date: evt.end_date ? new Date(evt.end_date).toISOString().slice(0, 16) : "",
      cover_image: evt.cover_image || "",
      publication_status: evt.publication_status,
      registration_status: evt.registration_status,
      registration_mode: evt.registration_mode || "onsite",
      gform_url: evt.gform_url || "",
      registration_questions: evt.registration_questions || [],
      coordinator_name: evt.coordinator_name || "",
      coordinator_phone: evt.coordinator_phone || "",
      coordinator1_name: c1Name,
      coordinator1_id: c1Id,
      coordinator1_phone: c1Phone,
      coordinator2_name: c2Name,
      coordinator2_id: c2Id,
      coordinator2_phone: c2Phone,
      coordinator2_type: c2Type,
      volunteer1_name: evt.volunteer1_name || (foundV1 ? foundV1.full_name : ""),
      volunteer1_id: evt.volunteer1_id || (foundV1 ? foundV1.id : ""),
      volunteer1_type: foundV1 || !evt.volunteer1_name ? "execom" : "external",
      volunteer2_name: evt.volunteer2_name || (foundV2 ? foundV2.full_name : ""),
      volunteer2_id: evt.volunteer2_id || (foundV2 ? foundV2.id : ""),
      volunteer2_type: foundV2 || !evt.volunteer2_name ? "execom" : "external",
      whatsapp_group_link: evt.whatsapp_group_link || "",
      certificate_drive_link: evt.certificate_drive_link || "",
      certificate_template_url: evt.certificate_template_url || "",
      certificate_enabled: evt.certificate_enabled ?? true,
      created_by: evt.created_by || user?.full_name || user?.email || "",
      created_by_id: evt.created_by_id || user?.id || null,
    });
    setEventError("");
    setEventModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setEventForm((prev) => ({
      ...prev,
      title: val,
      slug:
        editingEvent && prev.slug
          ? prev.slug
          : val
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, ""),
    }));
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEventError("Image must be smaller than 5MB.");
      return;
    }

    setUploadingPoster(true);
    setEventError("");

    try {
      const publicUrl = await uploadStorageFile("event-images", file, "posters");
      setEventForm((prev) => ({ ...prev, cover_image: publicUrl }));
    } catch (err: any) {
      setEventError(err.message || "Failed to upload event poster.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      setEventError("Event title is required.");
      return;
    }

    // Validation: Minimum 1 coordinator must be an active ExeCom member
    if (!eventForm.coordinator1_name.trim()) {
      setEventError("Coordinator 1 is required and must be an active ExeCom member.");
      return;
    }

    if (editingEvent && !canEditEvent(editingEvent)) {
      setEventError("Permission denied: Only event coordinators and administrators can edit this event.");
      return;
    }

    setSavingEvent(true);
    setEventError("");

    try {
      const combinedCoords = [eventForm.coordinator1_name, eventForm.coordinator2_name].filter(Boolean).join(", ");
      const combinedPhones = eventForm.coordinator1_phone || eventForm.coordinator2_phone || "";

      const { coordinator2_type, volunteer1_type, volunteer2_type, ...cleanForm } = eventForm;
      const finalPayload = {
        ...cleanForm,
        coordinator_name: combinedCoords,
        coordinator_phone: combinedPhones,
        // Non-admin members cannot directly publish events: require Admin/Super Admin approval
        publication_status: !isAdmin ? ("pending_approval" as PublicationStatus) : eventForm.publication_status,
      };

      if (editingEvent) {
        await updateEventAdmin(editingEvent.id, finalPayload);
      } else {
        await createEventAdmin(finalPayload);
      }
      setEventModalOpen(false);
      await loadData();
    } catch (err: any) {
      setEventError(err.message || "Failed to save event.");
    } finally {
      setSavingEvent(false);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (evt.venue && evt.venue.toLowerCase().includes(eventSearch.toLowerCase())) ||
      (evt.description && evt.description.toLowerCase().includes(eventSearch.toLowerCase()));

    const matchesStatus =
      eventStatusFilter === "all" || evt.publication_status === eventStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered ExeCom Members
  const filteredMembers = execomMembers.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.designation.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.department.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(memberSearch.toLowerCase()));

    const matchesDept = deptFilter === "all" || m.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(execomMembers.map((m) => m.department))).filter(Boolean);

  return (
    <div className="h-screen h-[100dvh] bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col w-full max-w-full overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* TOP HEADER BAR (Static - Pinned to top) */}
      {/* ------------------------------------------------------------------ */}
      <header className="shrink-0 sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs w-full max-w-full select-none">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                F
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none truncate">
                  FOSS CEPrn
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mt-0.5 truncate">
                  ExeCom Dashboard
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-200 mx-1" />

            <Badge variant="outline" className="hidden lg:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold py-0.5 px-2">
              EXECOM DASHBOARD
            </Badge>
          </div>

          {/* Right User Bar & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick QR Scanner Button */}
            <Button
              onClick={() => setActiveTab("scanner")}
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1 sm:gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 sm:px-3"
              title="Launch Live Event QR Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Scan QR</span>
            </Button>

            {/* If Admin, allow quick toggle */}
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs h-8 gap-1.5 border-slate-300">
                <Link to="/admin">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}

            <Button asChild variant="ghost" size="sm" className="text-xs h-8 text-slate-600 hover:text-slate-900 gap-1 px-2 sm:px-3">
              <Link to="/">
                <span className="hidden sm:inline">Public Site</span>
                <span className="sm:hidden text-[11px]">Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* User Info */}
            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                {user?.full_name ? user.full_name[0].toUpperCase() : "E"}
              </div>
              <span className="font-semibold text-slate-700 max-w-[120px] truncate">
                {user?.full_name || user?.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="text-xs h-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 gap-1 px-2"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="bg-slate-50/80 border-t border-slate-200/60 px-3 sm:px-6 lg:px-8 w-full max-w-full">
          {/* Mobile Dropdown Tab Selector (Replaces horizontal scrolling) */}
          <div className="md:hidden py-2 relative">
            <button
              type="button"
              onClick={() => setMobileTabDropdownOpen(!mobileTabDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 shadow-xs text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-expanded={mobileTabDropdownOpen}
            >
              <div className="flex items-center gap-2 truncate">
                {activeTab === "events" && <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />}
                {activeTab === "scanner" && <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />}
                {activeTab === "participants" && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                {activeTab === "calendar" && <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />}
                {activeTab === "team" && <Users className="w-4 h-4 text-emerald-600 shrink-0" />}
                {activeTab === "announcements" && <Megaphone className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span className="truncate">
                  {activeTab === "events" && "Events & Workshops"}
                  {activeTab === "scanner" && "Event QR Scanner"}
                  {activeTab === "participants" && "Participants List"}
                  {activeTab === "calendar" && "Activity Calendar"}
                  {activeTab === "team" && "ExeCom Team Directory"}
                  {activeTab === "announcements" && "Broadcast Announcements"}
                </span>
                {activeTab === "events" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {events.length}
                  </span>
                )}
                {activeTab === "calendar" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {upcomingActivitiesCount}
                  </span>
                )}
                {activeTab === "team" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {execomMembers.length}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${mobileTabDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileTabDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMobileTabDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100">
                  <button
                    onClick={() => { setActiveTab("events"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "events" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>Events & Workshops</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      {events.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("scanner"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "scanner" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-slate-500" />
                      <span>Event QR Scanner</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("participants"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "participants" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Participants List</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab("calendar"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "calendar" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="w-4 h-4 text-slate-500" />
                      <span>Activity Calendar</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      {upcomingActivitiesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("team"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "team" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>ExeCom Team Directory</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      {execomMembers.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("announcements"); setMobileTabDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === "announcements" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Megaphone className="w-4 h-4 text-slate-500" />
                      <span>Broadcast Announcements</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop Horizontal Tabs */}
          <div className="hidden md:flex w-full max-w-7xl mx-auto items-center gap-2 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "events"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events & Workshops</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "events" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "scanner"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Event QR Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab("participants")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "participants"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Participants List</span>
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "calendar"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Activity Calendar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "calendar" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {upcomingActivitiesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "team"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ExeCom Team Directory</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "team" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {execomMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "announcements"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Announcements</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA (Scrolls smoothly while top header stays static) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
        {/* Welcome Callout Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Welcome back, {user?.full_name || "ExeCom Member"}
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                ExeCom Member Session
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              ExeCom Member Dashboard
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Create and manage chapter workshops, check in attendees with live QR scanning, track student attendance, and coordinate with ExeCom team members.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setActiveTab("scanner")}
              className="bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 border border-emerald-400/40 font-bold text-xs gap-1.5 shadow-xs h-9 px-3.5"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scan QR Pass</span>
            </Button>

            <Button
              onClick={handleOpenCreateEvent}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* TAB 1: EVENTS MANAGEMENT */}
        {/* ================================================================ */}
        {activeTab === "events" && (
          <div className="space-y-5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Events</span>
                    <span className="text-2xl font-black text-slate-900">{events.length}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Published</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {events.filter((e) => e.publication_status === "published").length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Open Registrations</span>
                    <span className="text-2xl font-black text-blue-600">
                      {events.filter((e) => e.registration_status === "open").length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Drafts</span>
                    <span className="text-2xl font-black text-slate-500">
                      {events.filter((e) => e.publication_status === "draft").length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Chapter Activities (Full-width prominence, no Today's Schedule) */}
            <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upcoming Chapter Activities</h3>
                    <p className="text-xs text-slate-500">Official workshops, technical talks, peer reviews, and campus hackathons</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold text-slate-800">
                    {upcomingActivities.length} Upcoming
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("calendar")}
                    className="h-8 text-xs font-semibold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <span>Full Calendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {upcomingActivities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <CalendarDays className="w-8 h-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">No upcoming chapter activities scheduled yet.</p>
                  <Button
                    onClick={() => setActiveTab("calendar")}
                    variant="outline"
                    size="sm"
                    className="text-xs text-emerald-700"
                  >
                    Open Chapter Activity Calendar
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {upcomingActivities.map((act) => {
                    const dateObj = new Date(act.activity_date);
                    return (
                      <div
                        key={act.id}
                        onClick={() => setActiveTab("calendar")}
                        className="p-3.5 bg-slate-50/70 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between gap-3 group hover:border-emerald-300 hover:shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-2 py-0.5 font-bold border ${getCategoryBadgeClasses(
                                act.category
                              )}`}
                            >
                              {act.category}
                            </Badge>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{act.start_time}</span>
                            </span>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
                              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                                {dateObj.toLocaleDateString("en-US", { month: "short" })}
                              </span>
                              <span className="text-sm font-black text-slate-900 leading-none mt-0.5">
                                {dateObj.getDate()}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                                {act.title}
                              </h4>
                              {act.venue && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{act.venue}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {(act.deadline_date || (act.coordinators && act.coordinators.length > 0) || (act.volunteers && act.volunteers.length > 0)) && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-600">
                            {act.coordinators && act.coordinators.length > 0 ? (
                              <span className="font-medium flex items-center gap-1 truncate max-w-[160px]">
                                <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{act.coordinators.join(", ")}</span>
                              </span>
                            ) : <span />}

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {act.volunteers && act.volunteers.length > 0 && (
                                <span className="text-indigo-600 font-semibold flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                  <Users className="w-2.5 h-2.5" />
                                  <span>{act.volunteers.length} vol.</span>
                                </span>
                              )}
                              {act.deadline_date && (
                                <span className="text-amber-700 font-semibold flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 text-[9px]">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Due: {new Date(act.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Filter & Action Bar */}
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search events by title, venue..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200"
                    />
                  </div>

                  <select
                    value={eventStatusFilter}
                    onChange={(e) => setEventStatusFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto font-medium"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafts</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <Button
                  onClick={handleOpenCreateEvent}
                  size="sm"
                  className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Event</span>
                </Button>
              </CardContent>
            </Card>

            {/* Events List */}
            {eventsLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-xs text-slate-500">Loading chapter events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="border border-dashed border-slate-300 bg-white p-12 text-center rounded-2xl">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No events found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  {eventSearch
                    ? "Try adjusting your search criteria or clear status filters."
                    : "Get started by creating your first workshop, hackathon, or chapter meetup!"}
                </p>
                <Button
                  onClick={handleOpenCreateEvent}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Event</span>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((evt) => (
                  <Card
                    key={evt.id}
                    className="border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Event Poster or Header Banner */}
                      {evt.cover_image ? (
                        <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                          <img
                            src={evt.cover_image}
                            alt={evt.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-gradient-to-br from-emerald-600 to-teal-800 p-4 flex flex-col justify-between text-white relative">
                          <span className="text-[11px] font-mono text-emerald-100">
                            {evt.start_date ? formatDate(evt.start_date) : "TBD"}
                          </span>
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
                            {evt.title}
                          </h4>
                          <Badge
                            className={`text-[9px] px-1.5 py-0.5 shrink-0 ${
                              evt.publication_status === "published"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : evt.publication_status === "pending_approval"
                                ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {evt.publication_status === "pending_approval"
                              ? "⏳ Pending Approval"
                              : evt.publication_status}
                          </Badge>
                        </div>

                        {evt.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        )}

                        <div className="space-y-1 pt-1 text-[11px] text-slate-500 font-medium">
                          {evt.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(evt.start_date)}</span>
                            </div>
                          )}

                          {evt.venue && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.venue}</span>
                            </div>
                          )}

                          {evt.coordinator_name && (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">Coordinator: {evt.coordinator_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] capitalize ${
                            evt.registration_status === "open"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "text-slate-500"
                          }`}
                        >
                          Registration: {evt.registration_status}
                        </Badge>
                        {evt.registration_mode === "gform" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                            <Link2 className="w-2.5 h-2.5" />
                            <span>G-Form</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                            <QrCode className="w-2.5 h-2.5" />
                            <span>On-site QR</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Coordinators & Admins Approval */}
                        {canApproveEvent(evt) && evt.publication_status === "pending_approval" && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveEvent(evt)}
                            className="h-7 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            title="Approve and publish this event live to the website"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>Approve</span>
                          </Button>
                        )}

                        {/* Attendees & QR Attendance quick shortcuts */}
                        {evt.registration_mode !== "gform" && canManageEventAttendees(evt) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedScanEventId(evt.id);
                                setActiveTab("scanner");
                              }}
                              className="h-7 px-2 text-xs font-bold text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50"
                              title="Open live camera QR scanner for this event"
                            >
                              <QrCode className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              <span>Scan QR</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedParticipantEventId(evt.id);
                                setActiveTab("participants");
                              }}
                              className="h-7 px-2 text-xs font-bold text-blue-700 border-blue-200 bg-white hover:bg-blue-50"
                              title="View participants roster and mark attendance without QR"
                            >
                              <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
                              <span>Participants</span>
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Link to={`/events/${evt.slug || evt.id}`} target="_blank">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Preview</span>
                          </Link>
                        </Button>

                        {/* Only Event Creator or Admin can edit */}
                        {canEditEvent(evt) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditEvent(evt)}
                            className="h-7 px-2 text-xs font-bold text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100"
                            title="Edit event details"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>
                        ) : (
                          <span
                            className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded border border-slate-200 inline-flex items-center gap-1 cursor-default"
                            title="Only the creator or an admin can edit this event"
                          >
                            <span>🔒</span>
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: EVENT QR SCANNER */}
        {/* ================================================================ */}
        {activeTab === "scanner" && (
          <div className="space-y-6">
            {/* Header / Event Selector Card */}
            <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Event Check-in QR Scanner</h2>
                      <p className="text-xs text-slate-500">
                        Scan attendee invitation pass QR codes via device camera or enter ticket codes manually.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Selector */}
                {(() => {
                  const scannableEvents = isAdmin
                    ? events
                    : events.filter((e) => canManageEventAttendees(e));

                  return (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        Selected Event:
                      </label>
                      <select
                        value={selectedScanEventId}
                        onChange={(e) => {
                          setSelectedScanEventId(e.target.value);
                          setScanResult(null);
                        }}
                        className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium max-w-[280px] sm:max-w-[360px] truncate"
                      >
                        <option value="">
                          {isAdmin
                            ? "⭐ All Active Events (Auto-Detect Ticket)"
                            : "⭐ Your Assigned Events (Auto-Detect Ticket)"}
                        </option>
                        {scannableEvents.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.title} {evt.registration_mode === "gform" ? "(G-Form)" : "(Onsite QR)"}{" "}
                            {evt.created_by_id === user?.id ? "⭐ Your Event" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Camera Scanner */}
              <Card className="lg:col-span-6 p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Live Camera QR Scanner</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                    {isScanningCamera ? "Camera Active" : "Camera Standby"}
                  </Badge>
                </div>

                {/* Viewfinder Area */}
                <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border border-slate-300">
                  <div id="dashboard-camera-qr-reader" className="w-full h-full" />
                  {!isScanningCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Camera is Off</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click the button below to turn on your webcam or mobile camera to scan attendee passes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {!isScanningCamera ? (
                    <Button
                      onClick={startCameraScanner}
                      disabled={isAdmin ? events.length === 0 : events.filter((e) => canManageEventAttendees(e)).length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-9 px-5 shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCameraScanner}
                      variant="outline"
                      className="text-rose-600 border-rose-300 hover:bg-rose-50 font-bold text-xs gap-2 h-9 px-5"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Stop Scanner</span>
                    </Button>
                  )}

                  <label
                    className="cursor-pointer inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                    title="Upload an invitation pass image file or screenshot to scan"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload Pass Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScanImageFile}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  💡 Make sure the attendee holds their downloaded <strong>INVITATION PASS</strong> QR code steady inside the frame. Audio feedback beeps automatically on verification.
                </p>
              </Card>

              {/* Right Column: Manual Input, Live Result & Recent Check-in Stream */}
              <div className="lg:col-span-6 space-y-6">
                {/* Manual Ticket Input Card */}
                <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Manual Ticket Code Verification</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    If the attendee’s phone screen is dim, unreadable, or camera is unavailable, enter their ticket code below (e.g. <code>CEPRN-123456</code>).
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProcessTicketCode(manualTicketCode);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={manualTicketCode}
                      onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CEPRN-A1B2C3"
                      className="h-9 text-xs font-mono tracking-wider uppercase border-slate-200 rounded-xl"
                    />
                    <Button
                      type="submit"
                      disabled={verifyingCode || !manualTicketCode.trim()}
                      className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      {verifyingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          <span>Check In</span>
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Verification Result Feedback */}
                  {scanResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                        scanResult.type === "success"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : scanResult.type === "warning"
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : "bg-rose-50 border-rose-300 text-rose-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scanResult.type === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : scanResult.type === "warning" ? (
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold text-sm">{scanResult.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{scanResult.message}</p>

                      {scanResult.registration && (
                        <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium">
                          <span>Name: <strong>{scanResult.registration.full_name}</strong></span>
                          <span>Email: {scanResult.registration.email}</span>
                          {scanResult.registration.class_semester && (
                            <span>Class: {scanResult.registration.class_semester}</span>
                          )}
                          {scanResult.registration.phone && (
                            <span>Phone: {scanResult.registration.phone}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Live Session Check-ins Feed */}
                <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Session Check-ins</h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {recentScans.length} Admitted
                    </Badge>
                  </div>

                  {recentScans.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No tickets checked in during this session yet. Scan a QR code or enter a ticket code above.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {recentScans.map((item, idx) => (
                        <div
                          key={`${item.registration.id}-${idx}`}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">
                                {item.registration.full_name}
                              </span>
                              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {item.registration.ticket_code}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {item.registration.email} {item.registration.class_semester ? `· ${item.registration.class_semester}` : ""}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full inline-block">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: EVENTS PARTICIPANTS LIST */}
        {/* ================================================================ */}
        {activeTab === "participants" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Event Participants & Attendance</h2>
                      <p className="text-xs text-slate-500">
                        View student registrations, mark attendance without QR, and download verified attendance sheets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions & Event Selector */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {(() => {
                    const participantEvents = isAdmin
                      ? events
                      : events.filter((e) => canManageEventAttendees(e));

                    return (
                      <select
                        value={selectedParticipantEventId}
                        onChange={(e) => setSelectedParticipantEventId(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium max-w-[280px] sm:max-w-[340px] truncate"
                      >
                        {participantEvents.length === 0 && (
                          <option value="">No events you coordinate</option>
                        )}
                        {participantEvents.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.title} {evt.registration_mode === "gform" ? "(G-Form)" : "(Onsite QR)"}
                          </option>
                        ))}
                      </select>
                    );
                  })()}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadParticipantRegistrations(selectedParticipantEventId)}
                    className="h-9 px-3 text-xs gap-1.5 border-slate-200 hover:bg-slate-50"
                    title="Refresh participant registrations"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingParticipants ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleExportCsv}
                    disabled={participantRegistrations.length === 0}
                    className="h-9 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </Button>

                  {(() => {
                    const curEvt = events.find((e) => e.id === selectedParticipantEventId);
                    if (!curEvt) return null;
                    const attendedCount = participantRegistrations.filter((r) => r.checked_in).length;

                    return (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAttendeesEvent(curEvt)}
                          className="h-9 px-3 text-xs font-bold gap-1.5 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                          title="Generate certificates for attended participants"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Certificates ({attendedCount})</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={attendedCount === 0 || bulkSendingCerts}
                          onClick={() => handleBatchEmailCertificates(curEvt)}
                          className="h-9 px-3 text-xs font-bold gap-1.5 border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100"
                          title="Email official participation certificates to all attended participants"
                        >
                          {bulkSendingCerts ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Email All Certs ({attendedCount})</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={attendedCount === 0 || downloadingZip}
                          onClick={() => handleDownloadAllCertificatesZip(curEvt)}
                          className="h-9 px-3 text-xs font-bold gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          title="Download all participation certificates as a single compressed .ZIP file"
                        >
                          {downloadingZip ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>
                            {downloadingZip ? zipProgress : `Download All (ZIP) (${attendedCount})`}
                          </span>
                        </Button>

                        {curEvt.certificate_drive_link && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs font-bold gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <a
                              href={curEvt.certificate_drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Coordinator Edit-Enabled Google Drive Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Google Drive</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Feedback Banner */}
              {participantAlert && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                    participantAlert.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {participantAlert.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{participantAlert.text}</span>
                  </div>
                  <button
                    onClick={() => setParticipantAlert(null)}
                    className="text-[11px] underline opacity-80 hover:opacity-100"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Summary KPI Strip */}
              {(() => {
                const total = participantRegistrations.length;
                const attended = participantRegistrations.filter((r) => r.checked_in).length;
                const pending = total - attended;
                const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</span>
                      <p className="text-xl font-extrabold text-slate-800 mt-0.5">{total}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Checked In / Present</span>
                      <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{attended}</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Check-in</span>
                      <p className="text-xl font-extrabold text-amber-800 mt-0.5">{pending}</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Attendance Rate</span>
                      <p className="text-xl font-extrabold text-blue-800 mt-0.5">{rate}%</p>
                    </div>
                  </div>
                );
              })()}

              {/* Search & Filter Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Search by student name, email, phone, ticket code..."
                    className="pl-9 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Button
                    variant={participantStatusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setParticipantStatusFilter("all")}
                    className={`h-8 text-xs font-semibold ${participantStatusFilter === "all" ? "bg-slate-800 text-white" : ""}`}
                  >
                    All ({participantRegistrations.length})
                  </Button>
                  <Button
                    variant={participantStatusFilter === "checked_in" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setParticipantStatusFilter("checked_in")}
                    className={`h-8 text-xs font-semibold ${participantStatusFilter === "checked_in" ? "bg-emerald-600 text-white" : ""}`}
                  >
                    Present ({participantRegistrations.filter((r) => r.checked_in).length})
                  </Button>
                  <Button
                    variant={participantStatusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setParticipantStatusFilter("pending")}
                    className={`h-8 text-xs font-semibold ${participantStatusFilter === "pending" ? "bg-amber-600 text-white" : ""}`}
                  >
                    Pending ({participantRegistrations.filter((r) => !r.checked_in).length})
                  </Button>
                </div>
              </div>
            </Card>

            {/* Participants Roster Table or Access Restriction */}
            {(() => {
              const currentEvt = events.find((e) => e.id === selectedParticipantEventId);
              const isAllowed = currentEvt ? canManageEventAttendees(currentEvt) : false;

              if (currentEvt && !isAllowed && !isAdmin) {
                return (
                  <Card className="border border-amber-200 bg-amber-50/70 p-8 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-900">Access Restricted</h3>
                      <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto leading-relaxed">
                        Only the assigned event coordinators ({[currentEvt.coordinator1_name, currentEvt.coordinator2_name].filter(Boolean).join(" & ") || currentEvt.coordinator_name || "Assigned Coordinators"}) and administrators have permission to view the registered participants list and mark attendance for this event.
                      </p>
                    </div>
                  </Card>
                );
              }

              const filtered = participantRegistrations.filter((reg) => {
                const q = participantSearch.toLowerCase();
                const matchesQuery =
                  reg.full_name.toLowerCase().includes(q) ||
                  reg.email.toLowerCase().includes(q) ||
                  (reg.phone && reg.phone.toLowerCase().includes(q)) ||
                  reg.ticket_code.toLowerCase().includes(q) ||
                  (reg.class_semester && reg.class_semester.toLowerCase().includes(q));

                const matchesStatus =
                  participantStatusFilter === "all" ||
                  (participantStatusFilter === "checked_in" && reg.checked_in) ||
                  (participantStatusFilter === "pending" && !reg.checked_in);

                return matchesQuery && matchesStatus;
              });

              return (
                <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
                  {loadingParticipants ? (
                    <div className="p-12 text-center space-y-2">
                      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
                      <p className="text-xs text-slate-500">Loading registrations...</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No participants found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {participantSearch || participantStatusFilter !== "all"
                          ? "Try clearing filters or search queries."
                          : "No students have registered for this event yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-3 px-4">Ticket Pass</th>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Class / Branch</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Email Pass</th>
                            <th className="py-3 px-4">Check-in Time</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((reg) => (
                            <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                    {reg.ticket_code}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(reg.ticket_code);
                                      setCopiedTicketCode(reg.ticket_code);
                                      setTimeout(() => setCopiedTicketCode(null), 2000);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                    title="Copy ticket code"
                                  >
                                    {copiedTicketCode === reg.ticket_code ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{reg.full_name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{reg.email}</span>
                                  {reg.phone && (
                                    <>
                                      <span className="text-slate-300">·</span>
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{reg.phone}</span>
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-700">
                                {reg.class_semester || "—"}
                              </td>

                              <td className="py-3 px-4">
                                {reg.checked_in ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Present</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
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
                                    onClick={() => handleResendParticipantEmail(reg)}
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

                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : "—"}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Download PDF Ticket */}
                                  <button
                                    onClick={() => handleDownloadSingleTicket(reg)}
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
                                      onClick={() => handleDownloadSingleCert(reg)}
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

                                  {/* Certificate Send Email (Only for checked-in participants) */}
                                  {reg.checked_in && (
                                    <button
                                      onClick={() => handleSendCertificateToParticipant(reg)}
                                      disabled={sendingCertId === reg.id}
                                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                      title="Send official Certificate PDF to registered Gmail/Email"
                                    >
                                      {sendingCertId === reg.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                      ) : (
                                        <Send className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}

                                  {/* Manual Attendance Toggle */}
                                  <Button
                                    size="sm"
                                    disabled={togglingAttendanceId === reg.id}
                                    onClick={() => handleToggleAttendance(reg)}
                                    className={`h-7 px-2 text-xs font-bold ${
                                      reg.checked_in
                                        ? "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                    }`}
                                  >
                                    {togglingAttendanceId === reg.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : reg.checked_in ? (
                                      <>
                                        <UserX className="w-3 h-3 mr-1" />
                                        <span>Absent</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        <span>Present</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              );
            })()}

            {/* SUB-MODAL: SEND CERTIFICATE TO SPECIFIC GMAIL */}
            {specificCertModalOpen && targetAttendeeForCert && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Send Certificate via Email</h4>
                        <p className="text-[11px] text-slate-500">Deliver official participation PDF via Resend.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSpecificCertModalOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient Details</span>
                    <p className="text-sm font-black text-slate-900">{targetAttendeeForCert.full_name}</p>
                    <p className="text-xs text-slate-500 font-mono">Ticket ID: {targetAttendeeForCert.ticket_code}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Target Gmail / Destination Email</label>
                    <Input
                      type="email"
                      placeholder="student@gmail.com"
                      value={specificCertTargetEmail}
                      onChange={(e) => setSpecificCertTargetEmail(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSpecificCertTargetEmail(targetAttendeeForCert.email || "")}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Registered: {targetAttendeeForCert.email}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecificCertTargetEmail("fossceprn@gmail.com")}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold"
                      >
                        Verified: fossceprn@gmail.com
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    <strong>Resend Delivery Note:</strong> If in free sandbox mode without custom domain verification, Resend only delivers to the verified address (<code>fossceprn@gmail.com</code>). Delivering to any address routes a verified copy with all student credentials to <code>fossceprn@gmail.com</code>.
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSpecificCertModalOpen(false)}
                      className="h-9 text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!specificCertTargetEmail.trim() || sendingCertId === targetAttendeeForCert.id}
                      onClick={handleSendCertToSpecificEmail}
                      className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shadow-sm"
                    >
                      {sendingCertId === targetAttendeeForCert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Certificate</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: ACTIVITY CALENDAR */}
        {/* ================================================================ */}
        {activeTab === "calendar" && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  ExeCom Activity Calendar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View scheduled campus workshops, coding sessions, meetings, and hackathons (Read-Only).
                </p>
              </div>
            </div>

            <ActivityCalendar
              readOnly={true}
              canManage={false}
            />
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: ALL EXECOM MEMBERS DIRECTORY (READ-ONLY) */}
        {/* ================================================================ */}
        {activeTab === "team" && (
          <div className="space-y-5">
            {/* Explanatory Policy Notice */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-emerald-950 block">
                  Official Chapter ExeCom Leadership Directory
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  Here is the full directory of appointed faculty coordinators and student leads.
                  Note: Editing designations and adding/deleting official ExeCom members is reserved
                  for <strong>Chapter Administrators</strong>.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search by name, designation, department..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 h-9 text-xs border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Department:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto font-medium"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Members Grid */}
            {membersLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-xs text-slate-500">Loading ExeCom directory...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <Card className="border border-dashed border-slate-300 bg-white p-12 text-center rounded-2xl">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No members matched your search</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Try clearing the search query or department filter.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden"
                  >
                    <CardContent className="p-5 space-y-3.5">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50">
                          {member.photo_url ? (
                            <AvatarImage src={member.photo_url} alt={member.full_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="font-bold text-sm bg-emerald-100 text-emerald-800 rounded-xl">
                            {member.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {member.full_name}
                          </h4>
                          <span className="text-xs font-semibold text-emerald-700 block truncate">
                            {member.designation}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {member.department} {member.semester ? `· ${member.semester}` : ""}
                          </span>
                        </div>
                      </div>

                      {member.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 border-emerald-300 text-emerald-800 bg-emerald-50/50"
                        >
                          Active Lead
                        </Badge>

                        <div className="flex items-center gap-2">
                          {member.github_url && (
                            <a
                              href={member.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-900"
                              title="GitHub"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-600"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: ANNOUNCEMENTS */}
        {/* ================================================================ */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Chapter Announcements</h3>
                <p className="text-xs text-slate-500">Official bulletins published by the administration.</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {announcements.length} Notices
              </Badge>
            </div>

            {announcements.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No active announcements currently posted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => (
                  <Card key={item.id} className="border border-slate-200 bg-white">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                      {item.link_url && (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline pt-1"
                        >
                          <span>Learn more</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CREATE / EDIT EVENT */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingEvent ? "Edit Chapter Event" : "Create New Chapter Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Fill in the workshop or event details to publish it on the FOSS CEPrn website.
            </DialogDescription>
          </DialogHeader>

          {eventError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{eventError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Event Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Linux Kernel & Git Workshop"
                  value={eventForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  URL Slug *
                </label>
                <Input
                  required
                  placeholder="linux-kernel-git-workshop"
                  value={eventForm.slug}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Venue / Location</label>
              <Input
                placeholder="e.g. CS Lab 2 / Google Meet"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Event Description & Schedule
              </label>
              <textarea
                rows={3}
                placeholder="Overview, speakers, agenda, and prerequisites..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Poster Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Event Poster Image</label>
              <div className="flex items-center gap-3">
                <Input
                  type="url"
                  placeholder="https://... or upload below"
                  value={eventForm.cover_image}
                  onChange={(e) => setEventForm({ ...eventForm, cover_image: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
                <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPoster ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    disabled={uploadingPoster}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Publication Status</label>
                {isAdmin ? (
                  <select
                    value={eventForm.publication_status}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        publication_status: e.target.value as PublicationStatus,
                      })
                    }
                    className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="published">Published (Live on Website)</option>
                    <option value="pending_approval">Pending Admin Approval</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                ) : (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
                    <span>⏳ Pending Admin Approval</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-normal">
                      Admin review required
                    </span>
                  </div>
                )}
                {!isAdmin && (
                  <p className="text-[11px] text-slate-400">
                    Non-admin submissions require Super Admin / Admin approval before publishing live to the website.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Registration Status</label>
                <select
                  value={eventForm.registration_status}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      registration_status: e.target.value as RegistrationStatus,
                    })
                  }
                  className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="open">Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* DUAL COORDINATORS (2) & VOLUNTEERS (2) */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Event Coordinators & Student Volunteers</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assigned coordinators and admins can edit this event, manage registrations, and check in attendees.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Min. 1 ExeCom Coordinator
                </Badge>
              </div>

              {/* Coordinators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {/* Coordinator 1: Required ExeCom Member */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>Coordinator 1 *</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                        ExeCom Member
                      </span>
                    </label>
                  </div>
                  <select
                    required
                    value={eventForm.coordinator1_id || (execomMembers.find(m => m.full_name === eventForm.coordinator1_name)?.id || "")}
                    onChange={(e) => {
                      const sel = execomMembers.find(
                        (m) => m.id === e.target.value || m.full_name === e.target.value
                      );
                      if (sel) {
                        setEventForm((prev) => ({
                          ...prev,
                          coordinator1_name: sel.full_name,
                          coordinator1_id: sel.id,
                          coordinator1_phone: prev.coordinator1_phone || (sel as any).phone_number || "",
                        }));
                      } else {
                        setEventForm((prev) => ({
                          ...prev,
                          coordinator1_name: "",
                          coordinator1_id: "",
                        }));
                      }
                    }}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="">-- Select ExeCom Coordinator --</option>
                    {execomMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.designation} - {m.department})
                      </option>
                    ))}
                  </select>

                  <Input
                    placeholder="Coordinator 1 Phone / WhatsApp"
                    value={eventForm.coordinator1_phone}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, coordinator1_phone: e.target.value })
                    }
                    className="h-8 text-xs bg-white"
                  />
                </div>

                {/* Coordinator 2: ExeCom or External */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Coordinator 2 (Optional)</label>
                    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, coordinator2_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.coordinator2_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, coordinator2_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.coordinator2_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {eventForm.coordinator2_type === "execom" ? (
                    <select
                      value={eventForm.coordinator2_id || (execomMembers.find(m => m.full_name === eventForm.coordinator2_name)?.id || "")}
                      onChange={(e) => {
                        const sel = execomMembers.find(
                          (m) => m.id === e.target.value || m.full_name === e.target.value
                        );
                        if (sel) {
                          setEventForm((prev) => ({
                            ...prev,
                            coordinator2_name: sel.full_name,
                            coordinator2_id: sel.id,
                            coordinator2_phone: prev.coordinator2_phone || (sel as any).phone_number || "",
                          }));
                        } else {
                          setEventForm((prev) => ({
                            ...prev,
                            coordinator2_name: "",
                            coordinator2_id: "",
                          }));
                        }
                      }}
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="">-- None / Select ExeCom Member --</option>
                      {execomMembers
                        .filter((m) => m.id !== eventForm.coordinator1_id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.designation})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Enter external coordinator full name"
                      value={eventForm.coordinator2_name}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          coordinator2_name: e.target.value,
                          coordinator2_id: "",
                        })
                      }
                      className="h-9 text-xs bg-white"
                    />
                  )}

                  <Input
                    placeholder="Coordinator 2 Phone / WhatsApp"
                    value={eventForm.coordinator2_phone}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, coordinator2_phone: e.target.value })
                    }
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Volunteers Grid (2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {/* Volunteer 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Volunteer 1 (Optional)</label>
                    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, volunteer1_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.volunteer1_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, volunteer1_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.volunteer1_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {eventForm.volunteer1_type === "execom" ? (
                    <select
                      value={eventForm.volunteer1_name}
                      onChange={(e) => {
                        const sel = execomMembers.find((m) => m.full_name === e.target.value);
                        setEventForm({
                          ...eventForm,
                          volunteer1_name: e.target.value,
                          volunteer1_id: sel ? sel.id : "",
                        });
                      }}
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- None / Select ExeCom Volunteer --</option>
                      {execomMembers.map((m) => (
                        <option key={m.id} value={m.full_name}>
                          {m.full_name} ({m.department})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. Anjali Nair (S3 CSE)"
                      value={eventForm.volunteer1_name}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, volunteer1_name: e.target.value, volunteer1_id: "" })
                      }
                      className="h-9 text-xs bg-white"
                    />
                  )}
                </div>

                {/* Volunteer 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Volunteer 2 (Optional)</label>
                    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, volunteer2_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.volunteer2_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, volunteer2_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          eventForm.volunteer2_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {eventForm.volunteer2_type === "execom" ? (
                    <select
                      value={eventForm.volunteer2_name}
                      onChange={(e) => {
                        const sel = execomMembers.find((m) => m.full_name === e.target.value);
                        setEventForm({
                          ...eventForm,
                          volunteer2_name: e.target.value,
                          volunteer2_id: sel ? sel.id : "",
                        });
                      }}
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- None / Select ExeCom Volunteer --</option>
                      {execomMembers.map((m) => (
                        <option key={m.id} value={m.full_name}>
                          {m.full_name} ({m.department})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. Rahul K (S5 ECE)"
                      value={eventForm.volunteer2_name}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, volunteer2_name: e.target.value, volunteer2_id: "" })
                      }
                      className="h-9 text-xs bg-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Registration Mode & Configuration */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                Registration Mode *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setEventForm({ ...eventForm, registration_mode: "onsite" })}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                    eventForm.registration_mode === "onsite"
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>On-site Registration</span>
                    </span>
                    <input
                      type="radio"
                      name="execom_reg_mode"
                      checked={eventForm.registration_mode === "onsite"}
                      onChange={() => setEventForm({ ...eventForm, registration_mode: "onsite" })}
                      className="text-emerald-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Custom questions form with unique QR entry passes generated for check-in.
                  </p>
                </div>

                <div
                  onClick={() => setEventForm({ ...eventForm, registration_mode: "gform" })}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                    eventForm.registration_mode === "gform"
                      ? "border-blue-600 bg-blue-50/40 text-blue-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      <span>Google Form</span>
                    </span>
                    <input
                      type="radio"
                      name="execom_reg_mode"
                      checked={eventForm.registration_mode === "gform"}
                      onChange={() => setEventForm({ ...eventForm, registration_mode: "gform" })}
                      className="text-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    External Google Form registration link button.
                  </p>
                </div>
              </div>

              {eventForm.registration_mode === "gform" ? (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                  <label className="block text-xs font-bold text-blue-900">
                    Google Form Link (URL) *
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      required={eventForm.registration_mode === "gform"}
                      placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                      value={eventForm.gform_url}
                      onChange={(e) => setEventForm({ ...eventForm, gform_url: e.target.value })}
                      className="h-9 text-xs rounded-xl bg-white border-blue-200 flex-1 font-mono"
                    />
                    {eventForm.gform_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <a href={eventForm.gform_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Test</span>
                        </a>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-700/80">
                    Students will see a "Register via Google Form" button that directly opens this form in a new tab.
                  </p>
                </div>
              ) : (
                <EventRegistrationQuestionsBuilder
                  questions={eventForm.registration_questions}
                  onChange={(questions) =>
                    setEventForm({ ...eventForm, registration_questions: questions })
                  }
                />
              )}
            </div>

            {/* WhatsApp Group Link Configuration */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  Event WhatsApp Group
                </h4>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  WhatsApp Group Invite Link (Optional)
                </label>
                <Input
                  placeholder="https://chat.whatsapp.com/..."
                  value={eventForm.whatsapp_group_link || ""}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, whatsapp_group_link: e.target.value })
                  }
                  className="h-9 text-xs rounded-xl bg-white"
                />
                <p className="text-[10px] text-slate-400">
                  Participants will see a "Join WhatsApp Group" button immediately after registering and downloading their pass.
                </p>
              </div>
            </div>

            {/* Certificate & Google Drive Folder Configuration */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  Participation Certificates & Google Drive
                </h4>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Coordinator Edit-Enabled Google Drive Link
                </label>
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={eventForm.certificate_drive_link}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, certificate_drive_link: e.target.value })
                  }
                  className="h-9 text-xs rounded-xl bg-white"
                />
                <p className="text-[10px] text-slate-400">
                  Provide an edit-enabled Google Drive link so certificates for attended participants can be organized and shared.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Custom Certificate Background Template URL (Optional)
                </label>
                <Input
                  placeholder="https://... (or leave blank for official FOSS template)"
                  value={eventForm.certificate_template_url}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, certificate_template_url: e.target.value })
                  }
                  className="h-9 text-xs rounded-xl bg-white"
                />
                <p className="text-[10px] text-slate-400">
                  Leave blank to use the built-in FOSS United Students Chapter official certificate design.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEventModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEvent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                {savingEvent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Event...</span>
                  </>
                ) : (
                  <span>{editingEvent ? "Save Changes" : "Publish Event"}</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ATTENDEES & CHECK-IN MODAL */}
      <EventAttendeesModal
        isOpen={Boolean(attendeesEvent)}
        onClose={() => setAttendeesEvent(null)}
        event={attendeesEvent}
      />

      {/* ==================================================================== */}
      {/* MOBILE FLOATING MENU BAR (Round Floating Icon Only in Mobilephones) */}
      {/* ==================================================================== */}
      <div className="md:hidden">
        {/* Floating Action Button (FAB) */}
        <button
          type="button"
          onClick={() => setMobileFloatingMenuOpen(!mobileFloatingMenuOpen)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl flex items-center justify-center border-2 border-white/40 active:scale-95 transition-all"
          aria-label="Toggle ExeCom Navigation Menu"
        >
          {mobileFloatingMenuOpen ? (
            <XCircle className="w-6 h-6" />
          ) : activeTab === "events" ? (
            <Calendar className="w-6 h-6" />
          ) : activeTab === "scanner" ? (
            <QrCode className="w-6 h-6" />
          ) : activeTab === "participants" ? (
            <UserCheck className="w-6 h-6" />
          ) : activeTab === "calendar" ? (
            <CalendarDays className="w-6 h-6" />
          ) : activeTab === "team" ? (
            <Users className="w-6 h-6" />
          ) : (
            <Megaphone className="w-6 h-6" />
          )}
        </button>

        {/* Floating Menu Dock */}
        {mobileFloatingMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
              onClick={() => setMobileFloatingMenuOpen(false)}
            />
            <div className="fixed bottom-24 right-6 z-50 w-64 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 p-3 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ExeCom Navigation
              </div>

              <button
                onClick={() => { setActiveTab("events"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "events" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>Events & Workshops</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "events" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {events.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("scanner"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "scanner" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Event QR Scanner</span>
              </button>

              <button
                onClick={() => { setActiveTab("participants"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "participants" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Participants List</span>
              </button>

              <button
                onClick={() => { setActiveTab("calendar"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "calendar" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>Activity Calendar</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "calendar" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {upcomingActivitiesCount}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("team"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "team" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>ExeCom Directory</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "team" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {execomMembers.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("announcements"); setMobileFloatingMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  activeTab === "announcements" ? "bg-emerald-600 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Announcements</span>
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
                <Link
                  to="/"
                  target="_blank"
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Portal</span>
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExecomDashboard;