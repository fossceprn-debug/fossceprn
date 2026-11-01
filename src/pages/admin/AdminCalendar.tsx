import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ActivityCalendar } from "@/components/calendar/ActivityCalendar";
import {
  CalendarDays,
  Clock,
  Sparkles,
  CheckCircle2,
  CalendarCheck2,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllActivities } from "@/lib/activityService";
import type { ActivityItem } from "@/types";

export const AdminCalendar: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getAllActivities();
      setActivities(data);
    } catch (e) {
      console.warn("Could not load activities for metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = activities.filter(
    (a) => a.activity_date === todayStr && a.status === "published"
  ).length;

  const upcomingCount = activities.filter(
    (a) => a.activity_date >= todayStr && a.status === "published"
  ).length;

  const completedCount = activities.filter(
    (a) => a.activity_date < todayStr || a.status === "completed"
  ).length;

  return (
    <AdminLayout
      title="Activity Calendar"
      subtitle="Plan, schedule, and publish official FOSS CEPrn workshops, hackathons, meetings, and coding sessions."
    >
      <div className="space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Activities
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : activities.length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-emerald-50/30 border-emerald-100">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Today's Schedule
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-800 mt-0.5">
                  {loading ? "..." : todayCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Upcoming
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : upcomingCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Completed
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? "..." : completedCount}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Activity Calendar Component */}
        <ActivityCalendar
          readOnly={false}
          canManage={true}
          onActivityChange={loadData}
        />
      </div>
    </AdminLayout>
  );
};
