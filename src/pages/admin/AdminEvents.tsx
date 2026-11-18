import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  ExternalLink,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  QrCode,
  FileText,
  Link2,
  Database,
  Check,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  getAllEventsAdmin,
  createEventAdmin,
  updateEventAdmin,
  deleteEventAdmin,
  clearEventRegistrationsAdmin,
  uploadStorageFile,
  getAllExecomAdmin,
} from "@/lib/adminService";
import { formatDate } from "@/lib/utils";
import { EventRegistrationQuestionsBuilder } from "@/components/events/EventRegistrationQuestionsBuilder";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import type {
  EventItem,
  PublicationStatus,
  RegistrationStatus,
  RegistrationMode,
  RegistrationQuestion,
  ExecomMember,
} from "@/types";

export const AdminEvents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [execomMembers, setExecomMembers] = useState<ExecomMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearRegConfirmEvent, setClearRegConfirmEvent] = useState<EventItem | null>(null);
  const [clearingRegs, setClearingRegs] = useState(false);
  const [attendeesEvent, setAttendeesEvent] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    venue: "",
    start_date: "",
    end_date: "",
    cover_image: "",
    registration_status: "upcoming" as RegistrationStatus,
    publication_status: "draft" as PublicationStatus,
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
    volunteer1_type: "execom" as "execom" | "external",
    volunteer2_name: "",
    volunteer2_type: "execom" as "execom" | "external",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, teamData] = await Promise.all([
        getAllEventsAdmin(search, status),
        getAllExecomAdmin().catch(() => []),
      ]);
      setEvents(eventsData);
      setExecomMembers(teamData);
    } catch (err) {
      console.error("Error loading events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      venue: "Central Computing Lab, CE Perumon",
      start_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 7 * 86400000 + 3600000 * 3).toISOString().slice(0, 16),
      cover_image: "",
      registration_status: "upcoming",
      publication_status: "published",
      registration_mode: "onsite",
      gform_url: "",
      registration_questions: [],
      coordinator_name: "",
      coordinator_phone: "",
      coordinator1_name: "",
      coordinator1_id: "",
      coordinator1_phone: "",
      coordinator2_name: "",
      coordinator2_id: "",
      coordinator2_phone: "",
      coordinator2_type: "execom",
      volunteer1_name: "",
      volunteer1_type: "execom",
      volunteer2_name: "",
      volunteer2_type: "execom",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      slug: evt.slug,
      description: evt.description,
      venue: evt.venue,
      start_date: evt.start_date ? new Date(evt.start_date).toISOString().slice(0, 16) : "",
      end_date: evt.end_date ? new Date(evt.end_date).toISOString().slice(0, 16) : "",
      cover_image: evt.cover_image || "",
      registration_status: evt.registration_status,
      publication_status: evt.publication_status,
      registration_mode: evt.registration_mode || "onsite",
      gform_url: evt.gform_url || "",
      registration_questions: evt.registration_questions || [],
      coordinator_name: evt.coordinator_name || "",
      coordinator_phone: evt.coordinator_phone || "",
      coordinator1_name: evt.coordinator1_name || evt.coordinator_name || "",
      coordinator1_id: evt.coordinator1_id || "",
      coordinator1_phone: evt.coordinator1_phone || evt.coordinator_phone || "",
      coordinator2_name: evt.coordinator2_name || "",
      coordinator2_id: evt.coordinator2_id || "",
      coordinator2_phone: evt.coordinator2_phone || "",
      coordinator2_type: evt.coordinator2_id ? "execom" : "external",
      volunteer1_name: evt.volunteer1_name || "",
      volunteer1_type: execomMembers.some((m) => m.full_name === evt.volunteer1_name) ? "execom" : "external",
      volunteer2_name: evt.volunteer2_name || "",
      volunteer2_type: execomMembers.some((m) => m.full_name === evt.volunteer2_name) ? "execom" : "external",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingEvent ? prev.slug : autoSlug,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    try {
      const publicUrl = await uploadStorageFile("event-images", file, "events");
      setFormData((prev) => ({ ...prev, cover_image: publicUrl }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload cover image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coordinator1_name.trim()) {
      setErrorMsg("Coordinator 1 is required and must be an active ExeCom member.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const combinedCoords = [formData.coordinator1_name, formData.coordinator2_name].filter(Boolean).join(", ");
      const combinedPhones = formData.coordinator1_phone || formData.coordinator2_phone || "";

      const payload = {
        ...formData,
        coordinator_name: combinedCoords,
        coordinator_phone: combinedPhones,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (editingEvent) {
        await updateEventAdmin(editingEvent.id, payload);
      } else {
        await createEventAdmin(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEventAdmin(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error("Error deleting event", err);
    }
  };

  const handleClearRegistrations = async (eventId: string) => {
    setClearingRegs(true);
    try {
      await clearEventRegistrationsAdmin(eventId);
      setClearRegConfirmEvent(null);
      loadData();
    } catch (err) {
      console.error("Error clearing event registrations", err);
    } finally {
      setClearingRegs(false);
    }
  };

  const handleTogglePublish = async (evt: EventItem) => {
    const nextStatus: PublicationStatus =
      evt.publication_status === "published" ? "draft" : "published";
    try {
      await updateEventAdmin(evt.id, { publication_status: nextStatus });
      loadData();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const handleApprovePublish = async (evt: EventItem) => {
    try {
      await updateEventAdmin(evt.id, {
        publication_status: "published",
        approved_by: "Admin",
        approved_at: new Date().toISOString(),
      });
      loadData();
    } catch (err) {
      console.error("Error approving event", err);
    }
  };

  return (
    <AdminLayout
      title="Event Management"
      subtitle="Create, edit, schedule, and publish chapter workshops, bootcamps, and hackathons."
      actions={
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </Button>
      }
    >
      {/* Search & Filter Bar */}
      <Card className="p-4 border border-slate-200/80 bg-white rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="all">All Publication Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Schedule & Venue</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading events from database...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No events found</p>
                    <p className="text-[11px]">
                      {search || status !== "all"
                        ? "Try clearing filters."
                        : "Click 'Create Event' to publish your first workshop."}
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Event info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {evt.cover_image ? (
                          <img
                            src={evt.cover_image}
                            alt=""
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate max-w-[220px]">
                            {evt.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                            /{evt.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Schedule & Venue */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(evt.start_date)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{evt.venue}</span>
                      </div>
                    </td>

                    {/* Registration */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant={
                            evt.registration_status === "open"
                              ? "statusOpen"
                              : evt.registration_status === "upcoming"
                              ? "accent"
                              : "statusClosed"
                          }
                          className="text-[10px]"
                        >
                          {evt.registration_status.replace("_", " ").toUpperCase()}
                        </Badge>
                        {evt.registration_mode === "gform" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
                            <Link2 className="w-2.5 h-2.5" />
                            <span>G-Form</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                            <QrCode className="w-2.5 h-2.5" />
                            <span>On-site QR</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Publication Status */}
                    <td className="py-3 px-4">
                      {evt.publication_status === "pending_approval" ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ⏳ Pending Approval
                          </span>
                          <button
                            onClick={() => handleApprovePublish(evt)}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 transition-colors"
                          >
                            ✓ Approve & Publish
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTogglePublish(evt)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            evt.publication_status === "published"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          title="Click to toggle publish status"
                        >
                          {evt.publication_status === "published" ? "Published" : "Draft"}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {evt.registration_mode !== "gform" && (
                          <>
                            <button
                              onClick={() => setAttendeesEvent(evt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                              title="View Attendees & QR Check-In"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setClearRegConfirmEvent(evt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              title="Purge Event Registrations (Free Database Storage)"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-800"
                          title="Preview Event"
                        >
                          <Link to={`/events/${evt.slug || evt.id}`} target="_blank">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(evt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE / EDIT EVENT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Fill in the workshop or session details. Published events appear live on the public site.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Title *
              </label>
              <Input
                required
                placeholder="e.g. Linux Kernel & Shell Automation Bootcamp"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <Input
                  required
                  placeholder="linux-kernel-bootcamp"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue / Location *
                </label>
                <Input
                  required
                  placeholder="e.g. Central Computing Lab, CE Perumon"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date & Time *
                </label>
                <Input
                  required
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Status
                </label>
                <select
                  value={formData.registration_status}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_status: e.target.value as any })
                  }
                  className="h-9 w-full px-3 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="upcoming">Announced Soon (Upcoming)</option>
                  <option value="open">Registration Open</option>
                  <option value="closing_soon">Closing Soon</option>
                  <option value="closed">Registration Closed</option>
                  <option value="ended">Event Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.publication_status}
                  onChange={(e) =>
                    setFormData({ ...formData, publication_status: e.target.value as any })
                  }
                  className="h-9 w-full px-3 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                >
                  <option value="draft">Draft (Hidden from public)</option>
                  <option value="pending_approval">Pending Admin Approval</option>
                  <option value="published">Published (Live on Website)</option>
                  <option value="archived">Archived</option>
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
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Event Coordinators & Student Volunteers</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assign student coordinators and volunteers for this chapter workshop.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Min. 1 ExeCom Coordinator
                </Badge>
              </div>

              {/* Coordinators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
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
                    value={formData.coordinator1_id || formData.coordinator1_name}
                    onChange={(e) => {
                      const sel = execomMembers.find(
                        (m) => m.id === e.target.value || m.full_name === e.target.value
                      );
                      if (sel) {
                        setFormData((prev) => ({
                          ...prev,
                          coordinator1_name: sel.full_name,
                          coordinator1_id: sel.id,
                          coordinator1_phone: prev.coordinator1_phone || (sel as any).phone_number || "",
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          coordinator1_name: e.target.value,
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
                    value={formData.coordinator1_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinator1_phone: e.target.value })
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
                          setFormData((prev) => ({ ...prev, coordinator2_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.coordinator2_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, coordinator2_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.coordinator2_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {formData.coordinator2_type === "execom" ? (
                    <select
                      value={formData.coordinator2_id || formData.coordinator2_name}
                      onChange={(e) => {
                        const sel = execomMembers.find(
                          (m) => m.id === e.target.value || m.full_name === e.target.value
                        );
                        if (sel) {
                          setFormData((prev) => ({
                            ...prev,
                            coordinator2_name: sel.full_name,
                            coordinator2_id: sel.id,
                            coordinator2_phone: prev.coordinator2_phone || (sel as any).phone_number || "",
                          }));
                        } else {
                          setFormData((prev) => ({
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
                        .filter((m) => m.id !== formData.coordinator1_id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.designation})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Enter external coordinator name"
                      value={formData.coordinator2_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinator2_name: e.target.value,
                          coordinator2_id: "",
                        })
                      }
                      className="h-9 text-xs bg-white"
                    />
                  )}

                  <Input
                    placeholder="Coordinator 2 Phone / WhatsApp"
                    value={formData.coordinator2_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinator2_phone: e.target.value })
                    }
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Volunteers Grid (2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                {/* Volunteer 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Volunteer 1 (Optional)</label>
                    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, volunteer1_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.volunteer1_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, volunteer1_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.volunteer1_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {formData.volunteer1_type === "execom" ? (
                    <select
                      value={formData.volunteer1_name}
                      onChange={(e) =>
                        setFormData({ ...formData, volunteer1_name: e.target.value })
                      }
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
                      value={formData.volunteer1_name}
                      onChange={(e) =>
                        setFormData({ ...formData, volunteer1_name: e.target.value })
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
                          setFormData((prev) => ({ ...prev, volunteer2_type: "execom" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.volunteer2_type === "execom"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        ExeCom
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, volunteer2_type: "external" }))
                        }
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          formData.volunteer2_type === "external"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Non-ExeCom
                      </button>
                    </div>
                  </div>

                  {formData.volunteer2_type === "execom" ? (
                    <select
                      value={formData.volunteer2_name}
                      onChange={(e) =>
                        setFormData({ ...formData, volunteer2_name: e.target.value })
                      }
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
                      value={formData.volunteer2_name}
                      onChange={(e) =>
                        setFormData({ ...formData, volunteer2_name: e.target.value })
                      }
                      className="h-9 text-xs bg-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Cover Image Upload / URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Cover Image (Supabase Storage)
              </label>
              <div className="flex items-center gap-3">
                {formData.cover_image ? (
                  <img
                    src={formData.cover_image}
                    alt="Cover preview"
                    className="w-16 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    placeholder="https://... or upload file"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <label className="cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Image</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Agenda *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Comprehensive description of the event, prerequisite tools, prerequisites, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 leading-relaxed"
              />
            </div>

            {/* Registration Mode & Configuration */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                Registration Mode *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, registration_mode: "onsite" })}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                    formData.registration_mode === "onsite"
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
                      name="admin_reg_mode"
                      checked={formData.registration_mode === "onsite"}
                      onChange={() => setFormData({ ...formData, registration_mode: "onsite" })}
                      className="text-emerald-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Custom questions form with unique QR entry passes generated for check-in.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, registration_mode: "gform" })}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                    formData.registration_mode === "gform"
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
                      name="admin_reg_mode"
                      checked={formData.registration_mode === "gform"}
                      onChange={() => setFormData({ ...formData, registration_mode: "gform" })}
                      className="text-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    External Google Form registration link button.
                  </p>
                </div>
              </div>

              {formData.registration_mode === "gform" ? (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                  <label className="block text-xs font-bold text-blue-900">
                    Google Form Link (URL) *
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      required={formData.registration_mode === "gform"}
                      placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                      value={formData.gform_url}
                      onChange={(e) => setFormData({ ...formData, gform_url: e.target.value })}
                      className="h-9 text-xs rounded-xl bg-white border-blue-200 flex-1 font-mono"
                    />
                    {formData.gform_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <a href={formData.gform_url} target="_blank" rel="noopener noreferrer">
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
                  questions={formData.registration_questions}
                  onChange={(questions) =>
                    setFormData({ ...formData, registration_questions: questions })
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Event?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This event will be permanently deleted from the database and public site.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CLEAR REGISTRATIONS DATABASE DIALOG */}
      <Dialog
        open={Boolean(clearRegConfirmEvent)}
        onOpenChange={(open) => !open && setClearRegConfirmEvent(null)}
      >
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Clear Registrations Database?
            </h3>
            {clearRegConfirmEvent && (
              <p className="text-xs font-semibold text-slate-700 mt-1">
                Event: {clearRegConfirmEvent.title}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will permanently delete all student registrations, attendance logs, and QR code tickets for this event from the Supabase database to retain storage capacity. The event post itself and venue information will remain intact.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={clearingRegs}
              onClick={() => setClearRegConfirmEvent(null)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={clearingRegs}
              onClick={() =>
                clearRegConfirmEvent && handleClearRegistrations(clearRegConfirmEvent.id)
              }
              className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {clearingRegs ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Purging...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Purge & Free Storage</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ATTENDEES & QR CHECK-IN DIALOG */}
      <EventAttendeesModal
        isOpen={Boolean(attendeesEvent)}
        onClose={() => setAttendeesEvent(null)}
        event={attendeesEvent}
      />
    </AdminLayout>
  );
};
export default AdminEvents;

