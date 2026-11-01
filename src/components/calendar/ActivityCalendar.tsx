import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Tag,
  Filter,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ListFilter,
  CalendarDays,
  Columns,
  List,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ActivityItem, ActivityCategory, ActivityStatus } from "@/types";
import {
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/lib/activityService";

const CATEGORIES: ActivityCategory[] = [
  "Workshop",
  "Hackathon",
  "Meeting",
  "Coding Session",
  "Technical Talk",
  "Community Event",
  "Announcement",
  "Other",
];

const STATUSES: ActivityStatus[] = ["published", "draft", "completed", "archived"];

export function getCategoryBadgeClasses(category: string): string {
  switch (category) {
    case "Workshop":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    case "Hackathon":
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    case "Meeting":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "Coding Session":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    case "Technical Talk":
      return "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100";
    case "Community Event":
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    case "Announcement":
      return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
  }
}

export function getCategoryPillClasses(category: string): string {
  switch (category) {
    case "Workshop":
      return "bg-indigo-100 text-indigo-800 border-l-2 border-indigo-600";
    case "Hackathon":
      return "bg-amber-100 text-amber-800 border-l-2 border-amber-600";
    case "Meeting":
      return "bg-blue-100 text-blue-800 border-l-2 border-blue-600";
    case "Coding Session":
      return "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-600";
    case "Technical Talk":
      return "bg-sky-100 text-sky-800 border-l-2 border-sky-600";
    case "Community Event":
      return "bg-rose-100 text-rose-800 border-l-2 border-rose-600";
    case "Announcement":
      return "bg-purple-100 text-purple-800 border-l-2 border-purple-600";
    default:
      return "bg-slate-100 text-slate-800 border-l-2 border-slate-600";
  }
}

interface ActivityCalendarProps {
  readOnly?: boolean;
  canManage?: boolean;
  onActivityChange?: () => void;
  initialCategoryFilter?: string;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  readOnly = false,
  canManage = true,
  onActivityChange,
  initialCategoryFilter = "All",
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activity_date: new Date().toISOString().split("T")[0],
    start_time: "10:00 AM",
    end_time: "12:00 PM",
    venue: "",
    category: "Workshop" as ActivityCategory,
    status: "published" as ActivityStatus,
    created_by: "Admin",
  });

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getAllActivities();
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (readOnly && act.status !== "published" && act.status !== "completed") {
        return false;
      }
      if (selectedCategory !== "All" && act.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== "All" && act.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          act.title.toLowerCase().includes(query) ||
          act.venue.toLowerCase().includes(query) ||
          act.description.toLowerCase().includes(query) ||
          act.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activities, readOnly, selectedCategory, selectedStatus, searchQuery]);

  // Date Navigation
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Heading label
  const formattedHeaderTitle = useMemo(() => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    if (viewMode === "month" || viewMode === "list") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    // Week view heading
    const curr = new Date(currentDate);
    const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    const lastDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
    return `${monthNames[firstDay.getMonth()]} ${firstDay.getDate()} - ${
      monthNames[lastDay.getMonth()]
    } ${lastDay.getDate()}, ${lastDay.getFullYear()}`;
  }, [currentDate, viewMode]);

  // Form Handlers
  const handleOpenCreate = (prefilledDate?: string) => {
    setEditingActivity(null);
    setFormData({
      title: "",
      description: "",
      activity_date: prefilledDate || new Date().toISOString().split("T")[0],
      start_time: "10:00 AM",
      end_time: "12:00 PM",
      venue: "",
      category: "Workshop",
      status: "published",
      created_by: "Admin",
    });
    setFormError("");
    setFormModalOpen(true);
  };

  const handleOpenEdit = (act: ActivityItem) => {
    setEditingActivity(act);
    setFormData({
      title: act.title,
      description: act.description,
      activity_date: act.activity_date,
      start_time: act.start_time,
      end_time: act.end_time || "",
      venue: act.venue,
      category: act.category,
      status: act.status,
      created_by: act.created_by || "Admin",
    });
    setFormError("");
    setDetailsModalOpen(false);
    setFormModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Activity title is required.");
      return;
    }
    if (!formData.venue.trim()) {
      setFormError("Venue is required.");
      return;
    }
    setFormSaving(true);
    setFormError("");

    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, formData);
      } else {
        await createActivity(formData);
      }
      setFormModalOpen(false);
      await loadActivities();
      if (onActivityChange) onActivityChange();
    } catch (err: any) {
      setFormError(err.message || "Failed to save activity.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id);
      setDeleteConfirmId(null);
      setDetailsModalOpen(false);
      await loadActivities();
      if (onActivityChange) onActivityChange();
    } catch (err: any) {
      alert("Failed to delete activity: " + err.message);
    }
  };

  // Open Details Modal
  const handleViewDetails = (act: ActivityItem) => {
    setSelectedActivity(act);
    setDetailsModalOpen(true);
  };

  // Month grid calculations
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding (complete grid to multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const sunday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    const todayStr = new Date().toISOString().split("T")[0];

    const days: {
      dateStr: string;
      dayName: string;
      dayNum: number;
      isToday: boolean;
    }[] = [];

    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dateStr,
        dayName: names[i],
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate]);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Navigation & Current Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            {formattedHeaderTitle}
          </h2>
        </div>

        {/* View Switcher & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "month"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "week"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Week
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          {/* Add Activity Button (if authorized) */}
          {!readOnly && canManage && (
            <Button
              onClick={() => handleOpenCreate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl shadow-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities by title, venue..."
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown (only for admins/authorized) */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Quick Badges */}
          {(selectedCategory !== "All" || selectedStatus !== "All") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedStatus("All");
                setSearchQuery("");
              }}
              className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Calendar Views */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading activity calendar...</p>
        </div>
      ) : (
        <>
          {/* ==================================================================== */}
          {/* MONTH VIEW */}
          {/* ==================================================================== */}
          {viewMode === "month" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Day of Week Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-semibold text-slate-600">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                {monthCalendarDays.map((day, idx) => {
                  const dayActivities = filteredActivities.filter(
                    (a) => a.activity_date === day.dateStr
                  );

                  return (
                    <div
                      key={idx}
                      className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 transition-colors flex flex-col ${
                        day.isCurrentMonth
                          ? "bg-white hover:bg-slate-50/40"
                          : "bg-slate-50/40 text-slate-400"
                      } ${day.isToday ? "bg-emerald-50/20" : ""}`}
                    >
                      {/* Day number header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                            day.isToday
                              ? "bg-emerald-600 text-white shadow-sm"
                              : day.isCurrentMonth
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {day.dayNum}
                        </span>

                        {!readOnly && canManage && day.isCurrentMonth && (
                          <button
                            onClick={() => handleOpenCreate(day.dateStr)}
                            className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-opacity"
                            title="Add activity on this date"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Day activities list */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                        {dayActivities.map((act) => (
                          <button
                            key={act.id}
                            onClick={() => handleViewDetails(act)}
                            className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-medium leading-tight truncate block transition-all shadow-2xs ${getCategoryPillClasses(
                              act.category
                            )}`}
                            title={`${act.start_time} - ${act.title}`}
                          >
                            <span className="font-semibold">{act.start_time.split(" ")[0]} </span>
                            {act.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* WEEK VIEW */}
          {/* ==================================================================== */}
          {viewMode === "week" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {weekDays.map((day, idx) => {
                  const dayActivities = filteredActivities.filter(
                    (a) => a.activity_date === day.dateStr
                  );

                  return (
                    <div
                      key={idx}
                      className={`min-h-[380px] p-3 flex flex-col ${
                        day.isToday ? "bg-emerald-50/25" : "bg-white"
                      }`}
                    >
                      {/* Column Header */}
                      <div
                        className={`text-center pb-3 border-b border-slate-100 mb-3 ${
                          day.isToday ? "text-emerald-700 font-bold" : "text-slate-700"
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                          {day.dayName.slice(0, 3)}
                        </p>
                        <p
                          className={`text-xl font-bold mt-0.5 inline-block px-2.5 py-0.5 rounded-full ${
                            day.isToday ? "bg-emerald-600 text-white shadow-xs" : "text-slate-800"
                          }`}
                        >
                          {day.dayNum}
                        </p>
                      </div>

                      {/* Column Items */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto">
                        {dayActivities.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center p-3 text-slate-400 text-xs">
                            No activities
                          </div>
                        ) : (
                          dayActivities.map((act) => (
                            <div
                              key={act.id}
                              onClick={() => handleViewDetails(act)}
                              className="p-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 cursor-pointer transition-all hover:shadow-xs group"
                            >
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 mb-1.5 border font-semibold ${getCategoryBadgeClasses(
                                  act.category
                                )}`}
                              >
                                {act.category}
                              </Badge>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {act.title}
                              </h4>
                              <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{act.start_time}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{act.venue}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {!readOnly && canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCreate(day.dateStr)}
                          className="mt-3 w-full text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* LIST VIEW */}
          {/* ==================================================================== */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {filteredActivities.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No activities found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your category filter, status filter, or search keywords.
                  </p>
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const dateObj = new Date(act.activity_date);
                  const isPast =
                    act.activity_date < new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={act.id}
                      onClick={() => handleViewDetails(act)}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Date badge */}
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center shrink-0 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-colors">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {dateObj.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-lg font-extrabold text-slate-900 leading-none mt-0.5">
                            {dateObj.getDate()}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold border ${getCategoryBadgeClasses(
                                act.category
                              )}`}
                            >
                              {act.category}
                            </Badge>
                            {act.status !== "published" && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-medium uppercase tracking-wider"
                              >
                                {act.status}
                              </Badge>
                            )}
                            {isPast && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-slate-400 border-slate-200"
                              >
                                Completed
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {act.title}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                            {act.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {act.start_time} {act.end_time ? `– ${act.end_time}` : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {act.venue}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right action button */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 rounded-xl"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* ACTIVITY DETAILS POPUP MODAL */}
      {/* ==================================================================== */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl">
          {selectedActivity && (
            <div>
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 border-b border-slate-200/80">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold border ${getCategoryBadgeClasses(
                      selectedActivity.category
                    )}`}
                  >
                    {selectedActivity.category}
                  </Badge>
                  <Badge
                    variant={selectedActivity.status === "published" ? "default" : "secondary"}
                    className="text-xs font-semibold capitalize"
                  >
                    {selectedActivity.status}
                  </Badge>
                </div>

                <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {selectedActivity.title}
                </DialogTitle>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Date</p>
                      <p className="font-semibold">
                        {new Date(selectedActivity.activity_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Timing</p>
                      <p className="font-semibold">
                        {selectedActivity.start_time}{" "}
                        {selectedActivity.end_time ? `– ${selectedActivity.end_time}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Venue</p>
                      <p className="font-semibold">{selectedActivity.venue}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Activity Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {selectedActivity.description || "No detailed description provided."}
                  </p>
                </div>

                {/* Organizer Info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Organized by: {selectedActivity.created_by || "FOSS CEPrn"}</span>
                  <span>ID: {selectedActivity.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <div>
                  {!readOnly && canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(selectedActivity.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!readOnly && canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(selectedActivity)}
                      className="text-xs font-semibold gap-1.5 rounded-xl border-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setDetailsModalOpen(false)}
                    className="text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* CREATE / EDIT ACTIVITY DIALOG */}
      {/* ==================================================================== */}
      {!readOnly && canManage && (
        <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
          <DialogContent className="max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingActivity ? "Edit Activity" : "Create New Activity"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Fill in the official community event details to publish to the FOSS CEPrn calendar.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveActivity} className="space-y-4 pt-2">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Activity Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Hands-on Git & GitHub Essentials"
                  className="text-xs h-9"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ActivityCategory })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ActivityStatus })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Date *</label>
                  <Input
                    type="date"
                    required
                    value={formData.activity_date}
                    onChange={(e) =>
                      setFormData({ ...formData, activity_date: e.target.value })
                    }
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Time *</label>
                  <Input
                    required
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    placeholder="10:00 AM"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">End Time</label>
                  <Input
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    placeholder="01:00 PM"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Venue / Location *</label>
                <Input
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Computer Lab 2, CSE Block or Google Meet"
                  className="text-xs h-9"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide brief details on agenda, prerequisites, and who should attend..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Organizer / Created By */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Organizer / Host</label>
                <Input
                  value={formData.created_by}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  placeholder="FOSS CEPrn / ExeCom / Faculty"
                  className="text-xs h-9"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormModalOpen(false)}
                  className="text-xs h-9 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl px-4 gap-1.5 shadow-sm"
                >
                  {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingActivity ? "Save Changes" : "Create Activity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm p-6 rounded-2xl bg-white border border-slate-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Delete Activity
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Are you sure you want to remove this activity from the calendar? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <div className="pt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
