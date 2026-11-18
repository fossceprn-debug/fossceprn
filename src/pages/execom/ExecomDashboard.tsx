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
  Sparkles,
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
    created_by: user?.full_name || user?.email || "ExeCom Coordinator",
    created_by_id: user?.id || null,
  });

  const canManageEventAttendees = (evt: EventItem) => {
    if (isAdmin) return true;
    if (evt.created_by_id && user?.id && evt.created_by_id === user.id) return true;
    if (evt.created_by && user?.email && evt.created_by.toLowerCase() === user.email.toLowerCase()) return true;
    if (evt.coordinator_name && user?.full_name && evt.coordinator_name.toLowerCase().includes(user.full_name.toLowerCase())) return true;
    return false;
  };

  const canEditEvent = (evt: EventItem) => {
    if (isAdmin) return true;
    if (evt.created_by_id && user?.id && evt.created_by_id === user.id) return true;
    if (evt.created_by && user?.email && evt.created_by.toLowerCase() === user.email.toLowerCase()) return true;
    if (evt.created_by && user?.full_name && evt.created_by.toLowerCase() === user.full_name.toLowerCase()) return true;
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

  const handleApproveEvent = async (evt: EventItem) => {
    try {
      await updateEventAdmin(evt.id, {
        publication_status: "published",
        approved_by: user?.full_name || user?.email || "Admin",
        approved_at: new Date().toISOString(),
      });
      await loadData();
    } catch (err: any) {
      setEventError(err.message || "Failed to approve event.");
    }
  };

  const loadParticipantRegistrations = async (eventId: string) => {
    if (!eventId) return;
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
    const code = rawCode.trim();
    if (!code) return;
    setVerifyingCode(true);
    try {
      const res = await checkInAttendee(code, selectedScanEventId || undefined);
      if (res.success && res.registration) {
        const reg = res.registration;
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
    }
  };

  const startCameraScanner = async () => {
    setCameraError("");
    setIsScanningCamera(true);
    try {
      if (html5QrScannerRef.current) {
        try {
          if (html5QrScannerRef.current.isScanning) {
            await html5QrScannerRef.current.stop();
          }
        } catch {}
      }
      const scanner = new Html5Qrcode("dashboard-camera-qr-reader");
      html5QrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await handleProcessTicketCode(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Camera scanner error:", err);
      setCameraError(err?.message || "Camera access denied or device not supported.");
      setIsScanningCamera(false);
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
      const [eventsData, teamData, announceData, todayActs, upActs, allActs] = await Promise.all([
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
        getTodayActivities().catch((e) => {
          console.warn("Failed loading today activities:", e);
          return [];
        }),
        getUpcomingActivities(5).catch((e) => {
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
      setTodayActivities(todayActs);
      setUpcomingActivities(upActs);

      if (eventsData.length > 0) {
        const userEvent =
          eventsData.find(
            (e) => (canManageEventAttendees(e) || e.created_by_id === user?.id) && e.registration_mode !== "gform"
          ) ||
          eventsData.find((e) => e.registration_mode !== "gform") ||
          eventsData[0];

        setSelectedScanEventId((prev) => prev || userEvent.id);
        setSelectedParticipantEventId((prev) => prev || userEvent.id);
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const count = allActs.filter(
        (a) => a.activity_date >= todayStr && a.status === "published"
      ).length;
      setUpcomingActivitiesCount(count);
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
      coordinator_name: user?.full_name || "",
      coordinator_phone: "",
      created_by: user?.full_name || user?.email || "ExeCom Coordinator",
      created_by_id: user?.id || null,
    });
    setEventError("");
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: EventItem) => {
    if (!canEditEvent(evt)) {
      setEventError("Permission denied: You can only edit events created by you.");
      return;
    }
    setEditingEvent(evt);
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

    if (editingEvent && !canEditEvent(editingEvent)) {
      setEventError("Permission denied: You can only edit events created by you.");
      return;
    }

    setSavingEvent(true);
    setEventError("");

    try {
      const finalPayload = {
        ...eventForm,
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* TOP HEADER BAR */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
                  FOSS CEPrn
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mt-0.5">
                  ExeCom Member Dashboard
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-200 mx-1" />

            <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold py-0.5 px-2">
              EXECOM MEMBER DASHBOARD
            </Badge>
          </div>

          {/* Right User Bar & Actions */}
          <div className="flex items-center gap-2.5">
            {/* If Admin, allow quick toggle */}
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex text-xs h-8 gap-1.5 border-slate-300">
                <Link to="/admin">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Console</span>
                </Link>
              </Button>
            )}

            <Button asChild variant="ghost" size="sm" className="text-xs h-8 text-slate-600 hover:text-slate-900 gap-1.5">
              <Link to="/">
                <span>Public Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
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
              className="text-xs h-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 gap-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="bg-slate-50/80 border-t border-slate-200/60 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto flex items-center gap-2 overflow-x-auto py-2">
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
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                    <Sparkles className="w-5 h-5" />
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

            {/* Community Activities & Today's Schedule Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Today's Schedule */}
              <Card className="lg:col-span-5 p-5 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between shadow-2xs">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Today's Schedule</h3>
                        <p className="text-[10px] text-slate-400">
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={todayActivities.length > 0 ? "default" : "outline"}
                      className={
                        todayActivities.length > 0
                          ? "bg-emerald-600 text-white text-[10px]"
                          : "text-slate-400 text-[10px]"
                      }
                    >
                      {todayActivities.length} {todayActivities.length === 1 ? "Activity" : "Activities"}
                    </Badge>
                  </div>

                  {todayActivities.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                      <CalendarDays className="w-7 h-7 text-slate-300" />
                      <p>No community activities scheduled for today.</p>
                      <button
                        onClick={() => setActiveTab("calendar")}
                        className="text-xs font-semibold text-emerald-700 hover:underline mt-1"
                      >
                        Open Activity Calendar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todayActivities.map((act) => (
                        <div
                          key={act.id}
                          onClick={() => setActiveTab("calendar")}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-semibold border ${getCategoryBadgeClasses(
                                act.category
                              )}`}
                            >
                              {act.category}
                            </Badge>
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              {act.start_time}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {act.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{act.venue}</span>
                          </p>

                          {(act.deadline_date || (act.coordinators && act.coordinators.length > 0) || (act.volunteers && act.volunteers.length > 0)) && (
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                              {act.coordinators && act.coordinators.length > 0 && (
                                <span className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[180px]">
                                  <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{act.coordinators.join(", ")}</span>
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                {act.volunteers && act.volunteers.length > 0 && (
                                  <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" />
                                    {act.volunteers.length} vol.
                                  </span>
                                )}
                                {act.deadline_date && (
                                  <span className="text-amber-700 font-semibold flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 text-[9px]">
                                    <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                    Due: {new Date(act.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3">
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className="w-full flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>View Today in Full Calendar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>

              {/* Right: Next 5 Upcoming Activities */}
              <Card className="lg:col-span-7 p-5 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between shadow-2xs">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <CalendarDays className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Upcoming Activities</h3>
                        <p className="text-[10px] text-slate-400">Next community sessions</p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="text-xs font-bold text-slate-800">
                      {upcomingActivitiesCount} Total
                    </Badge>
                  </div>

                  {upcomingActivities.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No upcoming community activities announced yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingActivities.map((act) => {
                        const dateObj = new Date(act.activity_date);
                        return (
                          <div
                            key={act.id}
                            onClick={() => setActiveTab("calendar")}
                            className="p-2.5 bg-slate-50/70 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex flex-col gap-2 group"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-center shrink-0">
                                  <span className="text-[8px] uppercase font-bold text-slate-400 leading-none">
                                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-800 leading-none mt-0.5">
                                    {dateObj.getDate()}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] px-1 py-0 font-semibold border ${getCategoryBadgeClasses(
                                        act.category
                                      )}`}
                                    >
                                      {act.category}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                      <Clock className="w-3 h-3 text-slate-300" />
                                      {act.start_time}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                    {act.title}
                                  </h4>
                                </div>
                              </div>

                              <span className="text-[10px] text-slate-500 font-medium hidden sm:flex items-center gap-1 shrink-0">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[120px]">{act.venue}</span>
                              </span>
                            </div>

                            {(act.deadline_date || (act.coordinators && act.coordinators.length > 0) || (act.volunteers && act.volunteers.length > 0)) && (
                              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/60 text-[10px]">
                                {act.coordinators && act.coordinators.length > 0 && (
                                  <div className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[220px]">
                                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate">{act.coordinators.join(", ")}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                  {act.volunteers && act.volunteers.length > 0 && (
                                    <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                                      <Users className="w-2.5 h-2.5" />
                                      {act.volunteers.length} vol.
                                    </span>
                                  )}
                                  {act.deadline_date && (
                                    <span className="text-amber-700 font-semibold flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 text-[9px]">
                                      <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                      Due: {new Date(act.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Showing next {upcomingActivities.length} activities
                  </span>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Full Activity Calendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            </div>

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
                        {/* Admin One-click Approval */}
                        {isAdmin && evt.publication_status === "pending_approval" && (
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
                    {events.length === 0 && <option value="">No events available</option>}
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} {evt.registration_mode === "gform" ? "(G-Form)" : "(Onsite QR)"}{" "}
                        {evt.created_by_id === user?.id ? "⭐ Your Event" : ""}
                      </option>
                    ))}
                  </select>
                </div>
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

                <div className="flex items-center justify-center gap-3 pt-2">
                  {!isScanningCamera ? (
                    <Button
                      onClick={startCameraScanner}
                      disabled={!selectedScanEventId}
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
                  <select
                    value={selectedParticipantEventId}
                    onChange={(e) => setSelectedParticipantEventId(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium max-w-[280px] sm:max-w-[340px] truncate"
                  >
                    {events.length === 0 && <option value="">No events found</option>}
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} {evt.registration_mode === "gform" ? "(G-Form)" : "(Onsite QR)"}{" "}
                        {evt.created_by_id === user?.id ? "⭐ Your Event" : ""}
                      </option>
                    ))}
                  </select>

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
                </div>
              </div>

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

            {/* Participants Roster Table */}
            {(() => {
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
                            <th className="py-3 px-4">Check-in Time</th>
                            <th className="py-3 px-4 text-right">Attendance Action</th>
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

                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : "—"}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <Button
                                  size="sm"
                                  disabled={togglingAttendanceId === reg.id}
                                  onClick={() => handleToggleAttendance(reg)}
                                  className={`h-7 px-2.5 text-xs font-bold ${
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
                                      <span>Mark Absent</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      <span>Mark Present</span>
                                    </>
                                  )}
                                </Button>
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

            {/* Coordinator Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Event Coordinator Name
                </label>
                <Input
                  placeholder="e.g. Adithyan M / Shefeena"
                  value={eventForm.coordinator_name}
                  onChange={(e) => setEventForm({ ...eventForm, coordinator_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Coordinator Phone / WhatsApp
                </label>
                <Input
                  placeholder="e.g. 9995601670"
                  value={eventForm.coordinator_phone}
                  onChange={(e) => setEventForm({ ...eventForm, coordinator_phone: e.target.value })}
                  className="h-9 text-xs"
                />
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
    </div>
  );
};

export default ExecomDashboard;