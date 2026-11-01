import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  FolderGit2,
  Image,
  Megaphone,
  PlusCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminOverviewStats, getActivityLogs, type DashboardStats } from "@/lib/adminService";
import type { ActivityLogItem } from "@/types";

export const AdminOverview: React.FC = () => {
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
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        getAdminOverviewStats(),
        getActivityLogs(8),
      ]);
      setStats(s);
      setLogs(l);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kpis = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/admin/members",
      subtitle: "Registered community profiles",
    },
    {
      title: "Active ExeCom",
      value: stats.activeExecom,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      href: "/admin/execom",
      subtitle:
        (stats.pendingExecomApps || 0) > 0
          ? `${stats.pendingExecomApps} pending applicant${stats.pendingExecomApps === 1 ? "" : "s"}`
          : "Active committee coordinators",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      href: "/admin/events",
      subtitle: "Workshops and sessions",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      href: "/admin/events",
      subtitle: "Open or announced soon",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderGit2,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      href: "/admin/projects",
      subtitle: "Student open source software",
    },
    {
      title: "Gallery Images",
      value: stats.galleryImages,
      icon: Image,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      href: "/admin/gallery",
      subtitle: "Visual event archives",
    },
  ];

  const quickActions = [
    { title: "Review ExeCom", href: "/admin/execom?tab=applied", icon: Inbox },
    { title: "Add Member", href: "/admin/members?action=new", icon: Users },
    { title: "Add ExeCom", href: "/admin/execom?action=new", icon: UserCheck },
    { title: "Create Event", href: "/admin/events?action=new", icon: Calendar },
    { title: "Add Project", href: "/admin/projects?action=new", icon: FolderGit2 },
    { title: "Post Announcement", href: "/admin/announcements?action=new", icon: Megaphone },
  ];

  return (
    <AdminLayout
      title="Dashboard Overview"
      subtitle="Real-time metrics, content status, and administrative activities from Supabase."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadDashboardData}
          disabled={loading}
          className="h-9 gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      }
    >
      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.href}>
              <Card className="p-5 border border-slate-200/80 bg-white hover:border-emerald-500 hover:shadow-sm transition-all rounded-2xl group">
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>

                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {loading ? "..." : kpi.value}
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-1">{kpi.title}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{kpi.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Quick Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={i}
                  to={qa.href}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-center group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center mb-2 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800">
                    {qa.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Distribution */}
        <Card className="lg:col-span-6 p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Member Distribution by Branch</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {stats.totalMembers} Total
              </Badge>
            </div>

            {stats.membersByDept.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No member profiles registered yet. Members will be plotted here as they join.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {stats.membersByDept.map((item, idx) => {
                  const percentage =
                    stats.totalMembers > 0
                      ? Math.round((item.count / stats.totalMembers) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[200px]">{item.department}</span>
                        <span className="text-slate-500">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right: Events by Publication Status */}
        <Card className="lg:col-span-6 p-6 border border-slate-200/80 bg-white rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Event Publication Pipeline</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {stats.totalEvents} Total
              </Badge>
            </div>

            {stats.eventsByStatus.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No events in the database yet. Create an event to track publication status.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {stats.eventsByStatus.map((item, idx) => {
                  const percentage =
                    stats.totalEvents > 0
                      ? Math.round((item.count / stats.totalEvents) * 100)
                      : 0;
                  const isPub = item.status === "published";
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="capitalize">{item.status}</span>
                        <span className="text-slate-500">
                          {item.count} event{item.count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPub ? "bg-emerald-600" : "bg-amber-400"
                          }`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Administrative Activity Table */}
      <Card className="p-6 border border-slate-200/80 bg-white rounded-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Administrative Activity</h3>
            </div>
            <span className="text-xs text-slate-400">Live audit log from activity_logs</span>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recorded administrative activities yet. Changes made in the admin panel will be logged here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2.5 font-bold">Action</th>
                    <th className="pb-2.5 font-bold">Entity</th>
                    <th className="pb-2.5 font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono uppercase">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </AdminLayout>
  );
};
export default AdminOverview;

