import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  Calendar,
  Megaphone,
  GraduationCap,
  Clock,
  MapPin,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Phone,
  Mail,
  Github,
  Linkedin,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Layers,
  FileText,
  BookOpen,
  Info,
  CalendarCheck2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActivityCalendar, getCategoryBadgeClasses } from "@/components/calendar/ActivityCalendar";
import {
  getAdminOverviewStats,
  getActivityLogs,
  getMembersList,
  getAllExecomAdmin,
  getAllEventsAdmin,
  getAllAnnouncementsAdmin,
  type DashboardStats,
} from "@/lib/adminService";
import {
  getTodayActivities,
  getUpcomingActivities,
  getAllActivities,
} from "@/lib/activityService";
import { formatDate } from "@/lib/utils";
import type {
  ActivityItem,
  EventItem,
  ExecomMember,
  Profile,
  AnnouncementItem,
  ActivityLogItem,
} from "@/types";

type FacultyTab = "overview" | "calendar" | "members" | "execom" | "events" | "announcements";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
];

const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "Faculty"];

export const FacultyDashboard: React.FC = () => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State
  const initialTab = (searchParams.get("tab") as FacultyTab) || "overview";
  const [activeTab, setActiveTab] = useState<FacultyTab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab with URL search parameter
  const handleTabChange = (tab: FacultyTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  // Loading States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingExecom, setLoadingExecom] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Data States
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeExecom: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalProjects: 0,
    galleryImages: 0,
    totalAnnouncements: 0,
    eventsByStatus: [],
    membersByDept: [],
  });
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);

  // Members Tab State
  const [members, setMembers] = useState<Profile[]>([]);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDeptFilter, setMemberDeptFilter] = useState("all");
  const [memberSemFilter, setMemberSemFilter] = useState("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [memberPage, setMemberPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  // ExeCom Tab State
  const [execomMembers, setExecomMembers] = useState<ExecomMember[]>([]);
  const [execomSearch, setExecomSearch] = useState("");
  const [execomDeptFilter, setExecomDeptFilter] = useState("all");

  // Events Tab State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [eventRegFilter, setEventRegFilter] = useState("all");

  // Announcements Tab State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementTypeFilter, setAnnouncementTypeFilter] = useState("all");

  // Load Overview Data
  const loadOverviewData = async () => {
    setLoadingStats(true);
    try {
      const [s, l, todayActs, upActs, allActs] = await Promise.all([
        getAdminOverviewStats().catch(() => null),
        getActivityLogs(6).catch(() => []),
        getTodayActivities().catch(() => []),
        getUpcomingActivities(5).catch(() => []),
        getAllActivities().catch(() => []),
      ]);
      if (s) setStats(s);
      setLogs(l);
      setTodayActivities(todayActs);
      setUpcomingActivities(upActs);
      setAllActivities(allActs);
    } catch (err) {
      console.warn("Error loading overview stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Members Data
  const loadMembersData = async () => {
    setLoadingMembers(true);
    try {
      const res = await getMembersList({
        search: memberSearch,
        department: memberDeptFilter,
        semester: memberSemFilter,
        status: memberStatusFilter,
        page: memberPage,
        pageSize: 12,
      });
      setMembers(res.members);
      setTotalMembersCount(res.total);
    } catch (err) {
      console.warn("Error loading members list:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load Execom Data
  const loadExecomData = async () => {
    setLoadingExecom(true);
    try {
      const data = await getAllExecomAdmin();
      setExecomMembers(data);
    } catch (err) {
      console.warn("Error loading ExeCom directory:", err);
    } finally {
      setLoadingExecom(false);
    }
  };

  // Load Events Data
  const loadEventsData = async () => {
    setLoadingEvents(true);
    try {
      const data = await getAllEventsAdmin(eventSearch, eventStatusFilter);
      setEvents(data);
    } catch (err) {
      console.warn("Error loading events directory:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load Announcements Data
  const loadAnnouncementsData = async () => {
    setLoadingAnnouncements(true);
    try {
      const data = await getAllAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (err) {
      console.warn("Error loading announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadOverviewData();
  }, []);

  // Fetch when tab changes or search filters change
  useEffect(() => {
    if (activeTab === "members") {
      loadMembersData();
    } else if (activeTab === "execom") {
      loadExecomData();
    } else if (activeTab === "events") {
      loadEventsData();
    } else if (activeTab === "announcements") {
      loadAnnouncementsData();
    }
  }, [activeTab, memberPage, memberDeptFilter, memberSemFilter, memberStatusFilter]);

  // Debounced member search
  useEffect(() => {
    if (activeTab === "members") {
      const timer = setTimeout(() => {
        setMemberPage(1);
        loadMembersData();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [memberSearch]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Filtered Execom Members
  const filteredExecom = useMemo(() => {
    return execomMembers.filter((m) => {
      if (execomDeptFilter !== "all" && m.department !== execomDeptFilter) {
        return false;
      }
      if (execomSearch.trim()) {
        const q = execomSearch.toLowerCase().trim();
        return (
          m.full_name.toLowerCase().includes(q) ||
          m.designation.toLowerCase().includes(q) ||
          (m.department && m.department.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone_number && m.phone_number.includes(q))
        );
      }
      return true;
    });
  }, [execomMembers, execomSearch, execomDeptFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (eventRegFilter !== "all" && e.registration_status !== eventRegFilter) {
        return false;
      }
      if (eventSearch.trim()) {
        const q = eventSearch.toLowerCase().trim();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, eventSearch, eventRegFilter]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (announcementTypeFilter !== "all" && a.type !== announcementTypeFilter) {
        return false;
      }
      if (announcementSearch.trim()) {
        const q = announcementSearch.toLowerCase().trim();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.category && a.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [announcements, announcementSearch, announcementTypeFilter]);

  // Navigation Items
  const navItems = [
    {
      id: "overview" as FacultyTab,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "calendar" as FacultyTab,
      label: "Activity Calendar",
      icon: CalendarDays,
      badge: upcomingActivities.length > 0 ? `${upcomingActivities.length}` : null,
    },
    {
      id: "members" as FacultyTab,
      label: "Community Members",
      icon: Users,
      badge: stats.totalMembers > 0 ? `${stats.totalMembers}` : null,
    },
    {
      id: "execom" as FacultyTab,
      label: "ExeCom Leadership",
      icon: UserCheck,
      badge: stats.activeExecom > 0 ? `${stats.activeExecom}` : null,
    },
    {
      id: "events" as FacultyTab,
      label: "Events & Workshops",
      icon: Calendar,
      badge: stats.totalEvents > 0 ? `${stats.totalEvents}` : null,
    },
    {
      id: "announcements" as FacultyTab,
      label: "Announcements",
      icon: Megaphone,
      badge: stats.totalAnnouncements > 0 ? `${stats.totalAnnouncements}` : null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col lg:flex-row antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* ==================================================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col justify-between bg-white border-r border-slate-200/80 sticky top-0 h-screen z-30 shrink-0">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/faculty" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-indigo-600/20">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                  FOSS CEPrn
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1">
                  Faculty Console
                </span>
              </div>
            </Link>
          </div>

          {/* User Role Card */}
          <div className="p-4 mx-3 my-3 bg-gradient-to-r from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || "Faculty Coordinator"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="text-[9px] bg-white border-indigo-200 text-indigo-700 font-semibold px-1.5 py-0">
                    Read-Only Access
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Advisory Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-indigo-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Advisory Policy Notice */}
          <div className="p-3.5 m-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Advisory Mode</span>
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              You have comprehensive read-only oversight across all chapter activities and student records.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 hover:text-slate-900 h-8 gap-1.5"
            >
              <Link to="/" target="_blank">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Portal</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MOBILE TOP HEADER & DRAWER */}
      {/* ==================================================================== */}
      <header className="lg:hidden h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              F
            </div>
            <span className="font-extrabold text-sm text-slate-900">Faculty Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
            Read-Only
          </Badge>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-white border-b border-slate-200 p-4 space-y-2 z-40 shadow-xl max-h-[85vh] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/"
              target="_blank"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Portal</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-600 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight capitalize">
              {activeTab === "overview" && "Chapter Overview & Metrics"}
              {activeTab === "calendar" && "Activity Calendar (Read-Only)"}
              {activeTab === "members" && "Community Members Directory (Read-Only)"}
              {activeTab === "execom" && "Executive Committee Directory (Read-Only)"}
              {activeTab === "events" && "Events & Workshops Directory (Read-Only)"}
              {activeTab === "announcements" && "Announcements & Broadcasts (Read-Only)"}
            </h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold gap-1">
              <Eye className="w-3 h-3 text-indigo-600" />
              <span>Read-Only Advisory</span>
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 hover:text-slate-900 gap-1"
            >
              <Link to="/" target="_blank">
                <span>Public Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>

            {(isSuperAdmin || isAdmin) && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8"
              >
                <Link to="/admin">Admin Console</Link>
              </Button>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {user?.full_name || "Faculty Advisor"}
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW */}
          {/* ================================================================ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Callout Banner */}
              <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 border border-white/10">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Faculty Coordinator & Staff Advisor View</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Welcome, {user?.full_name || "Faculty Coordinator"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Official faculty advisory oversight across student open-source initiatives,
                    registered campus members, published workshops, and executive committee leadership.
                    Editing and administration controls are restricted to chapter admins.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2 p-3 bg-white/10 rounded-2xl border border-white/10 text-xs text-indigo-100">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card
                  onClick={() => handleTabChange("members")}
                  className="rounded-2xl border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Members
                      </p>
                      <h3 className="text-2xl font-black text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">
                        {loadingStats ? "..." : stats.totalMembers}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Registered students</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => handleTabChange("execom")}
                  className="rounded-2xl border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Active ExeCom
                      </p>
                      <h3 className="text-2xl font-black text-emerald-600 mt-0.5 group-hover:text-emerald-700 transition-colors">
                        {loadingStats ? "..." : stats.activeExecom}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Elected coordinators</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => handleTabChange("calendar")}
                  className="rounded-2xl border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Upcoming Activities
                      </p>
                      <h3 className="text-2xl font-black text-indigo-600 mt-0.5 group-hover:text-indigo-700 transition-colors">
                        {loadingStats ? "..." : upcomingActivities.length}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scheduled sessions</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => handleTabChange("events")}
                  className="rounded-2xl border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Events
                      </p>
                      <h3 className="text-2xl font-black text-purple-600 mt-0.5 group-hover:text-purple-700 transition-colors">
                        {loadingStats ? "..." : stats.totalEvents}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Workshops & talks</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => handleTabChange("announcements")}
                  className="rounded-2xl border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group col-span-2 lg:col-span-1"
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Announcements
                      </p>
                      <h3 className="text-2xl font-black text-amber-600 mt-0.5 group-hover:text-amber-700 transition-colors">
                        {loadingStats ? "..." : stats.totalAnnouncements}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Broadcast updates</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Schedule & Next 5 Upcoming Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Today's Schedule */}
                <Card className="lg:col-span-5 p-5 sm:p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between shadow-2xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Today's Schedule</h3>
                          <p className="text-[11px] text-slate-400">Active campus sessions</p>
                        </div>
                      </div>

                      <Badge
                        variant={todayActivities.length > 0 ? "default" : "outline"}
                        className={
                          todayActivities.length > 0
                            ? "bg-emerald-600 text-white text-[11px]"
                            : "text-slate-400 text-[11px]"
                        }
                      >
                        {todayActivities.length} {todayActivities.length === 1 ? "Activity" : "Activities"}
                      </Badge>
                    </div>

                    {todayActivities.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                        <CalendarDays className="w-8 h-8 text-slate-300" />
                        <p>No community activities scheduled for today.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {todayActivities.map((act) => (
                          <div
                            key={act.id}
                            onClick={() => handleTabChange("calendar")}
                            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 block transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold border ${getCategoryBadgeClasses(
                                  act.category
                                )}`}
                              >
                                {act.category}
                              </Badge>
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {act.start_time}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{act.venue}</span>
                            </p>

                            {(act.deadline_date || (act.coordinators && act.coordinators.length > 0) || (act.volunteers && act.volunteers.length > 0)) && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                                {act.coordinators && act.coordinators.length > 0 && (
                                  <span className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[200px]">
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
                                    <span className="text-amber-700 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
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

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => handleTabChange("calendar")}
                      className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Open Full Calendar</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>

                {/* Right: Next 5 Upcoming Activities */}
                <Card className="lg:col-span-7 p-5 sm:p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between shadow-2xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Upcoming Activities</h3>
                          <p className="text-[11px] text-slate-400">Next scheduled sessions</p>
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-xs font-bold text-slate-800">
                        {upcomingActivities.length} Upcoming
                      </Badge>
                    </div>

                    {upcomingActivities.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No upcoming community activities announced yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {upcomingActivities.map((act) => {
                          const dateObj = new Date(act.activity_date);
                          return (
                            <div
                              key={act.id}
                              onClick={() => handleTabChange("calendar")}
                              className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/70 transition-all flex flex-col gap-2 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                                      {dateObj.toLocaleDateString("en-US", { month: "short" })}
                                    </span>
                                    <span className="text-sm font-extrabold text-slate-800 leading-none mt-0.5">
                                      {dateObj.getDate()}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1.5 py-0 font-semibold border ${getCategoryBadgeClasses(
                                          act.category
                                        )}`}
                                      >
                                        {act.category}
                                      </Badge>
                                      <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                        <Clock className="w-3 h-3 text-slate-300" />
                                        {act.start_time}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {act.title}
                                    </h4>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 hidden sm:block">
                                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 justify-end">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-[140px]">{act.venue}</span>
                                  </span>
                                </div>
                              </div>

                              {(act.deadline_date || (act.coordinators && act.coordinators.length > 0) || (act.volunteers && act.volunteers.length > 0)) && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[10px]">
                                  {act.coordinators && act.coordinators.length > 0 && (
                                    <div className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[260px]">
                                      <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="truncate">{act.coordinators.join(", ")}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                                    {act.volunteers && act.volunteers.length > 0 && (
                                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                                        <Users className="w-2.5 h-2.5" />
                                        {act.volunteers.length} vol.
                                      </span>
                                    )}
                                    {act.deadline_date && (
                                      <span className="text-amber-700 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
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

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Showing next {upcomingActivities.length} activities
                    </span>
                    <button
                      onClick={() => handleTabChange("calendar")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <span>Full Calendar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              </div>

              {/* Recent Activity Logs Audit Trail */}
              {logs.length > 0 && (
                <Card className="p-5 sm:p-6 border border-slate-200/80 bg-white rounded-2xl shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Recent Chapter Activity Logs</h3>
                        <p className="text-[10px] text-slate-400">System event trail</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 px-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{log.action}</span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">
                            • {log.entity_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: ACTIVITY CALENDAR (READ-ONLY) */}
          {/* ================================================================ */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Chapter Activity Calendar
                  </h2>
                  <p className="text-xs text-slate-500">
                    Browse all scheduled workshops, coding sessions, meetings, and hackathons. Click any event to inspect leadership coordinators, volunteer rosters, and deadline milestones.
                  </p>
                </div>

                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs gap-1 py-1">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  Read-Only Inspection
                </Badge>
              </div>

              <ActivityCalendar
                readOnly={true}
                canManage={false}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: COMMUNITY MEMBERS DIRECTORY (READ-ONLY) */}
          {/* ================================================================ */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Registered Community Members Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    View active student members across all branches and semesters. Editing or modifying member records is restricted to Chapter Administrators.
                  </p>
                </div>

                <Badge variant="secondary" className="text-xs font-bold px-3 py-1">
                  {totalMembersCount} Registered Members
                </Badge>
              </div>

              {/* Filters Bar */}
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, student ID..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                      value={memberDeptFilter}
                      onChange={(e) => {
                        setMemberDeptFilter(e.target.value);
                        setMemberPage(1);
                      }}
                      className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      value={memberSemFilter}
                      onChange={(e) => {
                        setMemberSemFilter(e.target.value);
                        setMemberPage(1);
                      }}
                      className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="all">All Semesters</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={memberStatusFilter}
                      onChange={(e) => {
                        setMemberStatusFilter(e.target.value);
                        setMemberPage(1);
                      }}
                      className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Members Grid / Cards */}
              {loadingMembers ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Loading members directory...
                </div>
              ) : members.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                  No community members found matching the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {members.map((mem) => (
                    <Card
                      key={mem.id}
                      className="border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all rounded-2xl"
                    >
                      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                              <AvatarImage src={mem.avatar_url || ""} />
                              <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                                {(mem.full_name || mem.email || "M").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {mem.full_name || "Community Member"}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">{mem.email}</p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase font-bold shrink-0 ${
                              mem.membership_status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : mem.membership_status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "text-slate-500 border-slate-200"
                            }`}
                          >
                            {mem.membership_status || "Active"}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="truncate">
                            <strong className="text-slate-700">Dept:</strong> {mem.department || "Unspecified"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span>
                              <strong className="text-slate-700">Sem:</strong> {mem.semester || "—"}
                            </span>
                            {mem.student_id && (
                              <span className="font-mono text-[10px]">
                                ID: {mem.student_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {mem.github_url && (
                              <a
                                href={mem.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-800"
                                title="GitHub Profile"
                              >
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {mem.linkedin_url && (
                              <a
                                href={mem.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-blue-600"
                                title="LinkedIn Profile"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMember(mem)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-7 px-2.5 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Details</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalMembersCount > 12 && (
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={memberPage === 1}
                    onClick={() => setMemberPage(memberPage - 1)}
                    className="text-xs h-8"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>

                  <span className="text-xs text-slate-500">
                    Page {memberPage} of {Math.ceil(totalMembersCount / 12)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={memberPage * 12 >= totalMembersCount}
                    onClick={() => setMemberPage(memberPage + 1)}
                    className="text-xs h-8"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: EXECOM LEADERSHIP DIRECTORY (READ-ONLY) */}
          {/* ================================================================ */}
          {activeTab === "execom" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Official Executive Committee Leadership Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Directory of appointed faculty coordinators and student leads. Adding members or reassigning official leadership designations is restricted to Chapter Administrators.
                  </p>
                </div>

                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold gap-1 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Official Directory
                </Badge>
              </div>

              {/* Filter Bar */}
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search coordinators by name, designation..."
                      value={execomSearch}
                      onChange={(e) => setExecomSearch(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200"
                    />
                  </div>

                  <select
                    value={execomDeptFilter}
                    onChange={(e) => setExecomDeptFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto font-medium"
                  >
                    <option value="all">All Departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {/* ExeCom Member Cards */}
              {loadingExecom ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Loading ExeCom directory...
                </div>
              ) : filteredExecom.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                  No ExeCom members found matching the search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredExecom.map((mem) => {
                    const isFacultyMember =
                      mem.role === "faculty" ||
                      mem.designation?.toLowerCase().includes("faculty") ||
                      mem.designation?.toLowerCase().includes("staff advisor");
                    return (
                      <Card
                        key={mem.id}
                        className={`border rounded-2xl transition-all ${
                          isFacultyMember
                            ? "border-indigo-200 bg-indigo-50/20 shadow-xs"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start gap-3.5">
                            <Avatar className="w-12 h-12 border border-slate-200 shadow-2xs shrink-0">
                              <AvatarImage src={mem.photo_url || ""} />
                              <AvatarFallback className="bg-indigo-600 text-white font-extrabold text-sm">
                                {mem.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {mem.full_name}
                                </h4>
                                {isFacultyMember && (
                                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] px-1.5 py-0">
                                    Faculty
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-emerald-700 mt-0.5 truncate">
                                {mem.designation}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {mem.department} {mem.semester ? `• ${mem.semester}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                            {mem.email && (
                              <div className="flex items-center gap-2 text-slate-600 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${mem.email}`}
                                  className="truncate hover:text-indigo-600"
                                >
                                  {mem.email}
                                </a>
                              </div>
                            )}
                            {mem.phone_number && (
                              <div className="flex items-center gap-2 text-slate-600 truncate">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a
                                  href={`tel:${mem.phone_number}`}
                                  className="truncate hover:text-emerald-700 font-medium"
                                >
                                  {mem.phone_number}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Social links */}
                          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Order #{mem.display_order}
                            </span>

                            <div className="flex items-center gap-2">
                              {mem.github_url && (
                                <a
                                  href={mem.github_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-slate-900"
                                  title="GitHub"
                                >
                                  <Github className="w-4 h-4" />
                                </a>
                              )}
                              {mem.linkedin_url && (
                                <a
                                  href={mem.linkedin_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-blue-600"
                                  title="LinkedIn"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: EVENTS & WORKSHOPS (READ-ONLY) */}
          {/* ================================================================ */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Chapter Events & Workshops Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review past, active, and upcoming workshops, technical talks, and hackathons. All events are viewable in read-only mode.
                  </p>
                </div>

                <Badge variant="secondary" className="text-xs font-bold px-3 py-1">
                  {events.length} Total Events
                </Badge>
              </div>

              {/* Filters */}
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search events by title, venue..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={eventRegFilter}
                      onChange={(e) => setEventRegFilter(e.target.value)}
                      className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto font-medium"
                    >
                      <option value="all">All Registrations</option>
                      <option value="open">Open</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="closed">Closed</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Event Cards */}
              {loadingEvents ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Loading events directory...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                  No chapter events found matching criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredEvents.map((evt) => (
                    <Card
                      key={evt.id}
                      className="border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {evt.cover_image ? (
                          <div className="h-36 w-full overflow-hidden bg-slate-100">
                            <img
                              src={evt.cover_image}
                              alt={evt.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-gradient-to-r from-indigo-900 to-slate-900 flex items-center justify-center text-white">
                            <Calendar className="w-8 h-8 opacity-40" />
                          </div>
                        )}

                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold ${
                                evt.registration_status === "open"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "text-slate-500 border-slate-200"
                              }`}
                            >
                              Registration: {evt.registration_status}
                            </Badge>
                            <Badge
                              variant={evt.publication_status === "published" ? "default" : "secondary"}
                              className="text-[9px] capitalize"
                            >
                              {evt.publication_status}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {evt.title}
                          </h3>

                          {evt.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {evt.description}
                            </p>
                          )}

                          <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                            {evt.start_date && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDate(evt.start_date)}</span>
                              </div>
                            )}
                            {evt.venue && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{evt.venue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          ID: {evt.id.slice(0, 8)}
                        </span>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs text-indigo-600 hover:text-indigo-700 h-7 px-2"
                        >
                          <Link to={`/events/${evt.slug || evt.id}`} target="_blank">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            <span>Preview Live Page</span>
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: ANNOUNCEMENTS (READ-ONLY) */}
          {/* ================================================================ */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Chapter Broadcast Announcements
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official bulletins and campus notifications broadcast to the FOSS community.
                  </p>
                </div>

                <Badge variant="secondary" className="text-xs font-bold px-3 py-1">
                  {announcements.length} Announcements
                </Badge>
              </div>

              {/* Filter */}
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search announcements..."
                      value={announcementSearch}
                      onChange={(e) => setAnnouncementSearch(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200"
                    />
                  </div>

                  <select
                    value={announcementTypeFilter}
                    onChange={(e) => setAnnouncementTypeFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto font-medium"
                  >
                    <option value="all">All Types</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="event">Event</option>
                  </select>
                </CardContent>
              </Card>

              {/* Announcement List */}
              {loadingAnnouncements ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Loading announcements...
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                  No announcements found matching the criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAnnouncements.map((ann) => (
                    <Card key={ann.id} className="border border-slate-200 bg-white rounded-2xl p-4 sm:p-5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold ${
                                ann.type === "warning"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : ann.type === "event"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : ann.type === "success"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {ann.type}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {formatDate(ann.created_at)}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                        </div>

                        <Badge variant="secondary" className="text-[10px] capitalize self-start">
                          {ann.publication_status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {ann.content}
                      </p>

                      {ann.link_url && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400">Related Resource</span>
                          <a
                            href={ann.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FOSS CEPrn Faculty Advisor Console • College of Engineering Perumon</span>
          <span className="text-[11px] text-slate-400">
            Read-only oversight portal • Official chapter records
          </span>
        </footer>
      </div>

      {/* ==================================================================== */}
      {/* MEMBER DETAILS MODAL (READ-ONLY) */}
      {/* ==================================================================== */}
      {selectedMember && (
        <Dialog open={Boolean(selectedMember)} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Member Profile Details</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Official community membership record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Avatar className="w-12 h-12 border border-slate-200 shrink-0">
                  <AvatarImage src={selectedMember.avatar_url || ""} />
                  <AvatarFallback className="bg-indigo-600 text-white font-bold">
                    {(selectedMember.full_name || selectedMember.email || "M").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {selectedMember.full_name || "Community Member"}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{selectedMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedMember.department || "Unspecified"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Semester
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedMember.semester || "—"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Student ID
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedMember.student_id || "—"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Status
                  </span>
                  <span className="font-semibold capitalize text-emerald-700">
                    {selectedMember.membership_status || "Active"}
                  </span>
                </div>
              </div>

              {selectedMember.bio && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Bio / Statement
                  </span>
                  <p className="text-slate-600 leading-relaxed">{selectedMember.bio}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span>Joined: {formatDate(selectedMember.created_at)}</span>
                <div className="flex items-center gap-2">
                  {selectedMember.github_url && (
                    <a
                      href={selectedMember.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-black flex items-center gap-1 font-semibold"
                    >
                      <Github className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  )}
                  {selectedMember.linkedin_url && (
                    <a
                      href={selectedMember.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setSelectedMember(null)}
                  className="w-full text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
