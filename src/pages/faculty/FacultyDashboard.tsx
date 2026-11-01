import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  LogOut,
  ExternalLink,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  ChevronRight,
  Layers,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityCalendar, getCategoryBadgeClasses } from "@/components/calendar/ActivityCalendar";
import {
  getTodayActivities,
  getUpcomingActivities,
  getAllActivities,
} from "@/lib/activityService";
import { getPublishedEvents } from "@/lib/supabase";
import { getAllExecomAdmin } from "@/lib/adminService";
import type { ActivityItem, EventItem, ExecomMember } from "@/types";

export const FacultyDashboard: React.FC = () => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [coordinators, setCoordinators] = useState<ExecomMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayActs, upActs, allActs, evs, exList] = await Promise.all([
        getTodayActivities(),
        getUpcomingActivities(5),
        getAllActivities(),
        getPublishedEvents(),
        getAllExecomAdmin().catch(() => []),
      ]);
      setTodayActivities(todayActs);
      setUpcomingActivities(upActs);
      setAllActivities(allActs);
      setEvents(evs);
      setCoordinators(exList);
    } catch (err) {
      console.warn("Error loading faculty dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = allActivities.filter(
    (a) => a.activity_date >= todayStr && a.status === "published"
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-emerald-600/20">
              F
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                FOSS CEPrn
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Faculty Console
              </span>
            </div>
          </Link>
        </div>

        {/* User Account Bar & Nav */}
        <div className="flex items-center gap-3">
          {/* Quick link to public site */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900 hidden md:flex items-center gap-1.5"
          >
            <Link to="/" target="_blank">
              <span>Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </Button>

          {/* Admin link if user is also admin */}
          {(isSuperAdmin || isAdmin) && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
            >
              <Link to="/admin">Admin Console</Link>
            </Button>
          )}

          {/* Profile Card */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.full_name || "Faculty Coordinator"}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty Coordinator & Staff Advisor View</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.full_name || "Faculty Advisor"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Monitor student open-source initiatives, published community workshops, hackathons, and
              scheduled department club sessions. You have official oversight access across the
              FOSS CEPrn chapter.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-emerald-600" />
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

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Today's Activities
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-800 mt-0.5">
                  {loading ? "..." : todayActivities.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Upcoming Activities
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : upcomingCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Events
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : events.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ExeCom Coordinators
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : coordinators.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule & Next 5 Upcoming Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Today's Schedule */}
          <Card className="lg:col-span-5 p-5 sm:p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
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
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 block transition-all"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Right: Next 5 Upcoming Activities */}
          <Card className="lg:col-span-7 p-5 sm:p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
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
                        className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/70 transition-all flex items-center justify-between gap-3"
                      >
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
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Full Read-Only Activity Calendar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Community Activity Calendar
              </h2>
              <p className="text-xs text-slate-500">
                Browse all scheduled community workshops, meetings, coding sessions, and hackathons.
              </p>
            </div>
          </div>

          <ActivityCalendar
            readOnly={true}
            canManage={false}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        FOSS CEPrn Faculty Advisor Console • College of Engineering Perumon
      </footer>
    </div>
  );
};
