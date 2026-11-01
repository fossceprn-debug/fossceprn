import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Github,
  Linkedin,
  Mail,
  Megaphone,
  Shield,
  Eye,
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
} from "@/lib/adminService";
import { formatDate } from "@/lib/utils";
import type {
  EventItem,
  ExecomMember,
  AnnouncementItem,
  PublicationStatus,
  RegistrationStatus,
} from "@/types";

export const ExecomDashboard: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Active Tab: "events" | "team" | "announcements"
  const [activeTab, setActiveTab] = useState<"events" | "team" | "announcements">("events");

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
    publication_status: "published" as PublicationStatus,
    registration_status: "open" as RegistrationStatus,
  });

  const loadData = async () => {
    try {
      setEventsLoading(true);
      setMembersLoading(true);
      const [eventsData, teamData, announceData] = await Promise.all([
        getAllEventsAdmin(),
        getAllExecomAdmin(),
        getAllAnnouncementsAdmin(),
      ]);
      setEvents(eventsData);
      setExecomMembers(teamData);
      setAnnouncements(announceData);
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
      publication_status: "published",
      registration_status: "open",
    });
    setEventError("");
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: EventItem) => {
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
      const publicUrl = await uploadStorageFile("events", file, "posters");
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

    setSavingEvent(true);
    setEventError("");

    try {
      if (editingEvent) {
        await updateEventAdmin(editingEvent.id, eventForm);
      } else {
        await createEventAdmin(eventForm);
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
                  ExeCom Dashboard
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-200 mx-1" />

            <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold py-0.5 px-2">
              COORDINATOR · EDITOR
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
                Welcome back, {user?.full_name || "ExeCom Lead"}
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px]">
                Active Session
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              ExeCom Leadership Dashboard
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Plan and publish chapter events, create workshops and hackathons, and review your official ExeCom team members.
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
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {evt.publication_status}
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
                      </div>

                      <div className="flex items-center gap-1.5">
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

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditEvent(evt)}
                          className="h-7 px-2 text-xs font-bold text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: ALL EXECOM MEMBERS DIRECTORY (READ-ONLY) */}
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
                <select
                  value={eventForm.publication_status}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      publication_status: e.target.value as PublicationStatus,
                    })
                  }
                  className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
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
    </div>
  );
};

export default ExecomDashboard;