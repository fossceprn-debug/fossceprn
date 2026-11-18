import React, { useState, useEffect } from "react";
import {
  Database,
  HardDrive,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ChevronDown,
  Info,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  getDatabaseStorageStats,
  clearEventRegistrations,
  clearAllPastEventRegistrations,
  deleteEventAdmin,
  getEventRegistrations,
  type DatabaseStorageStats,
  type EventStorageItem,
} from "@/lib/adminService";

export const AdminStorage: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "past">("all");

  // Clear Single Event Registrations Dialog
  const [clearEventTarget, setClearEventTarget] = useState<EventStorageItem | null>(null);
  const [clearing, setClearing] = useState(false);

  // Delete Single Event Entirely Dialog
  const [deleteEventTarget, setDeleteEventTarget] = useState<EventStorageItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Clear All Past Dialog
  const [clearAllPastOpen, setClearAllPastOpen] = useState(false);
  const [clearingPast, setClearingPast] = useState(false);

  // Success / Alert message
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDatabaseStorageStats();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading database storage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearSingleEvent = async () => {
    if (!clearEventTarget) return;
    setClearing(true);
    setActionMessage(null);
    try {
      const purged = await clearEventRegistrations(clearEventTarget.id);
      setActionMessage({
        type: "success",
        text: `Successfully purged ${purged} registration records for "${clearEventTarget.title}". Database capacity reclaimed!`,
      });
      setClearEventTarget(null);
      await loadStats();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to clear event registrations.",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSingleEvent = async () => {
    if (!deleteEventTarget) return;
    setDeleting(true);
    setActionMessage(null);
    try {
      await deleteEventAdmin(deleteEventTarget.id);
      setActionMessage({
        type: "success",
        text: `Permanently deleted "${deleteEventTarget.title}" and all its student registration data from the database.`,
      });
      setDeleteEventTarget(null);
      await loadStats();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to delete event.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllPast = async () => {
    setClearingPast(true);
    setActionMessage(null);
    try {
      const purgedTotal = await clearAllPastEventRegistrations();
      setActionMessage({
        type: "success",
        text: `Successfully purged ${purgedTotal} attendee records from past completed events. Database storage optimized!`,
      });
      setClearAllPastOpen(false);
      await loadStats();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to purge past event registrations.",
      });
    } finally {
      setClearingPast(false);
    }
  };

  const handleExportEventCsv = async (evt: EventStorageItem) => {
    try {
      const regs = await getEventRegistrations(evt.id);
      if (regs.length === 0) {
        alert(`No attendee registrations found for "${evt.title}".`);
        return;
      }

      const headers = [
        "Ticket Code",
        "Full Name",
        "Email",
        "Phone",
        "Class Semester",
        "Attendance Status",
        "Check-in Timestamp",
        "Registered At",
      ];
      const rows = regs.map((r) => [
        `"${r.ticket_code}"`,
        `"${r.full_name}"`,
        `"${r.email}"`,
        `"${r.phone || ""}"`,
        `"${r.class_semester || ""}"`,
        `"${r.checked_in ? "Checked In" : "Pending"}"`,
        `"${r.checked_in_at || ""}"`,
        `"${r.created_at}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Registrations-${evt.slug || evt.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export attendee CSV.");
    }
  };

  // Filter events list
  const filteredEvents = (stats?.eventBreakdown || []).filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(search.toLowerCase()) ||
      (evt.slug && evt.slug.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    const isPast = evt.start_date && new Date(evt.start_date).getTime() < Date.now();
    if (statusFilter === "past") return isPast;
    if (statusFilter === "active") return !isPast;
    return true;
  });

  const totalBytes = stats?.estimatedTotalBytes || 0;
  const limitBytes = stats?.supabaseLimitBytes || 524288000;
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const limitMB = (limitBytes / (1024 * 1024)).toFixed(0);
  const usagePercent = Math.min(100, Math.max(0.1, (totalBytes / limitBytes) * 100)).toFixed(2);

  return (
    <AdminLayout
      title="Database & Storage Manager"
      subtitle="Monitor database row capacity, reclaim storage by deleting registrations event-by-event, and keep Supabase free tier ultra-lean."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
          className="h-9 gap-2 text-xs border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </Button>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Action feedback alert */}
        {actionMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
              actionMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top KPI Strip: Storage and Row Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Estimated Storage Size */}
          <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Database Footprint
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{usedMB} MB</span>
                <span className="text-xs text-slate-400 font-semibold">/ {limitMB} MB limit</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {usagePercent}% utilized • Free Tier Safe
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, parseFloat(usagePercent))}%` }}
              />
            </div>
          </Card>

          {/* Card 2: Total Database Rows */}
          <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Database Rows
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">
                {stats?.totalRows.toLocaleString() || "0"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Across {Object.keys(stats?.tableCounts || {}).length} application tables
              </p>
            </div>
          </Card>

          {/* Card 3: Event Registrations Stored */}
          <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Attendee Registrations
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">
                {stats?.tableCounts.event_registrations.toLocaleString() || "0"}
              </span>
              <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                Can be purged event-by-event below
              </p>
            </div>
          </Card>

          {/* Card 4: Zero Storage Waste Architecture */}
          <Card className="p-5 border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Pass Image Storage
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-950">0 KB Stored</span>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-snug">
                Passes render on client devices on demand. No image blobs stored in Supabase!
              </p>
            </div>
          </Card>
        </div>

        {/* Database Tables Row Count Breakdown */}
        <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Database Tables Row Count Breakdown</h3>
            </div>
            <span className="text-[11px] text-slate-400">Live PostgREST metadata</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
            {stats &&
              Object.entries(stats.tableCounts).map(([table, count]) => (
                <div
                  key={table}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-0.5"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate block">
                    {table.replace(/_/g, " ")}
                  </span>
                  <p className="text-base font-black text-slate-800">{count}</p>
                </div>
              ))}
          </div>
        </Card>

        {/* Bulk Purge & Storage Reclamation Tools */}
        <Card className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-amber-950">
                Bulk Database Capacity Reclamation
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Have completed past workshops that no longer need attendee rosters stored in Supabase?
                You can purge attendee registrations for past events with one click while keeping the event information safe.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearAllPastOpen(true)}
            className="h-10 px-4 text-xs font-bold border-amber-400 text-amber-900 bg-white hover:bg-amber-100 shadow-xs shrink-0 gap-2"
          >
            <Trash2 className="w-4 h-4 text-amber-600" />
            <span>Purge All Past Event Registrations</span>
          </Button>
        </Card>

        {/* Event-by-Event Storage Manager Table */}
        <Card className="p-5 border border-slate-200/80 bg-white rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Event-by-Event Data Management</h3>
              <p className="text-xs text-slate-500">
                Inspect attendee counts and reclaim storage by deleting registrations event-by-event.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter events..."
                  className="pl-9 h-9 text-xs rounded-xl border-slate-200"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="all">All Events</option>
                <option value="active">Upcoming / Active</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode & Status</th>
                  <th className="py-3 px-4">Stored Registrations</th>
                  <th className="py-3 px-4">Storage Footprint</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No events match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Event Title */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[240px]">
                        <span className="truncate block">{evt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                          /{evt.slug || evt.id}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {evt.start_date ? formatDate(evt.start_date) : "No date"}
                      </td>

                      {/* Mode & Publication Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap space-x-1.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {evt.registration_mode === "gform" ? "G-Form" : "Onsite QR"}
                        </Badge>
                        <Badge
                          className={`text-[10px] font-semibold uppercase ${
                            evt.publication_status === "published"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {evt.publication_status}
                        </Badge>
                      </td>

                      {/* Registrations Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {evt.registrationsCount > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-800 text-sm">
                              {evt.registrationsCount} students
                            </span>
                            <span className="text-[10px] text-emerald-600 block font-semibold">
                              ({evt.checkedInCount} checked in)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">0 registered</span>
                        )}
                      </td>

                      {/* Estimated Bytes */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono">
                        {(evt.estimatedBytes / 1024).toFixed(1)} KB
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {/* Export CSV Button */}
                        {evt.registrationsCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportEventCsv(evt)}
                            className="h-8 px-2.5 text-xs text-blue-700 hover:bg-blue-50"
                            title="Export student registrations CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                            <span>Export</span>
                          </Button>
                        )}

                        {/* Clear Registrations Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={evt.registrationsCount === 0}
                          onClick={() => setClearEventTarget(evt)}
                          className="h-8 px-2.5 text-xs font-bold text-amber-700 border-amber-200 bg-amber-50/40 hover:bg-amber-100"
                          title="Purge registrations for this event to free database rows"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>Clear Registrations</span>
                        </Button>

                        {/* Delete Event Entirely Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteEventTarget(evt)}
                          className="h-8 px-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          title="Permanently delete event and all records"
                        >
                          <span>Delete Event</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* DIALOG 1: Confirm Clear Registrations for Single Event */}
      <Dialog open={Boolean(clearEventTarget)} onOpenChange={(open) => !open && setClearEventTarget(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Clear Event Registrations?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all{" "}
              <strong>{clearEventTarget?.registrationsCount || 0} student registrations</strong> for{" "}
              <strong>"{clearEventTarget?.title}"</strong> from the database.
              <br />
              <br />
              💡 The event details, title, and poster will remain untouched on the website. Only the student check-in records will be purged to free up database capacity.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearEventTarget(null)}
              className="h-9 text-xs rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={clearing}
              onClick={handleClearSingleEvent}
              className="h-9 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
            >
              {clearing ? "Reclaiming Storage..." : "Yes, Clear Registrations"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Confirm Delete Single Event Entirely */}
      <Dialog open={Boolean(deleteEventTarget)} onOpenChange={(open) => !open && setDeleteEventTarget(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Permanently Delete Event?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteEventTarget?.title}"</strong>? This will permanently delete the event record and all its attendee registrations from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteEventTarget(null)}
              className="h-9 text-xs rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={deleting}
              onClick={handleDeleteSingleEvent}
              className="h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
            >
              {deleting ? "Deleting Event..." : "Delete Event & All Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Confirm Clear All Past Events Registrations */}
      <Dialog open={clearAllPastOpen} onOpenChange={setClearAllPastOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Purge All Past Event Registrations?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              This action will scan all completed events that finished more than 7 days ago and purge their stored attendee registration records to reclaim database storage.
              <br />
              <br />
              Upcoming and active events will NOT be touched.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearAllPastOpen(false)}
              className="h-9 text-xs rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={clearingPast}
              onClick={handleClearAllPast}
              className="h-9 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
            >
              {clearingPast ? "Purging Past Records..." : "Purge Past Event Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStorage;

