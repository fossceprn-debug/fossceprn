import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getEventRegistrations, checkInAttendee } from "@/lib/adminService";
import type { EventItem, EventRegistration } from "@/types";

interface EventAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
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

  // Quick check-in input
  const [quickCode, setQuickCode] = useState("");
  const [checkInMsg, setCheckInMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
      setQuickCode("");
      setSearch("");
    }
  }, [isOpen, event?.id]);

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim() || !event) return;

    setCheckingIn(true);
    setCheckInMsg(null);
    try {
      const res = await checkInAttendee(quickCode.trim(), event.id);
      if (res.success && res.registration) {
        setCheckInMsg({
          type: "success",
          text: `Success! Checked in: ${res.registration.full_name} (${res.registration.ticket_code})`,
        });
        setQuickCode("");
        // Refresh local list
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

  const handleToggleCheckIn = async (reg: EventRegistration) => {
    if (!event) return;
    try {
      const res = await checkInAttendee(reg.ticket_code, event.id);
      if (res.success && res.registration) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === res.registration!.id ? res.registration! : r))
        );
      }
    } catch (err) {
      console.error("Error toggling check-in:", err);
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
      "Checked In",
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
      r.checked_in ? "Yes" : "No",
      r.checked_in_at ? `"${formatDate(r.checked_in_at)}"` : '""',
      `"${formatDate(r.created_at)}"`,
      `"${JSON.stringify(r.responses || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendees-${event.slug || "event"}.csv`);
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
                <span>Attendees & Check-In</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Verify QR ticket codes and track physical attendance for this event.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={registrations.length === 0}
                className="h-9 text-xs rounded-xl gap-1.5 border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

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
              <span className="text-[10px] uppercase font-bold text-emerald-600">Checked In</span>
              <p className="text-xl font-black text-emerald-600">{totalCheckedIn}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600">Pending</span>
              <p className="text-xl font-black text-amber-600">{totalRegistered - totalCheckedIn}</p>
            </div>
          </div>

          {/* Quick Check-in Code Form */}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, ticket code..."
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
              Checked In ({totalCheckedIn})
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

        {/* Registrations Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Ticket Code</th>
                  <th className="py-2.5 px-3">Attendee</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Class/Sem</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading attendees...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
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
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {reg.full_name}
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
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-[10px]">
                            Not Checked In
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          size="sm"
                          variant={reg.checked_in ? "outline" : "default"}
                          onClick={() => handleToggleCheckIn(reg)}
                          className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
                            reg.checked_in
                              ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {reg.checked_in ? "Checked In" : "Check-In"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
