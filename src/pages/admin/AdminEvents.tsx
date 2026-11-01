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
  uploadStorageFile,
} from "@/lib/adminService";
import { formatDate } from "@/lib/utils";
import type { EventItem, PublicationStatus, RegistrationStatus } from "@/types";

export const AdminEvents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllEventsAdmin(search, status);
      setEvents(data);
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
      publication_status: "draft",
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
    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        ...formData,
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
                    </td>

                    {/* Publication Status */}
                    <td className="py-3 px-4">
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
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
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
                  <option value="published">Published (Live on Website)</option>
                  <option value="archived">Archived</option>
                </select>
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
    </AdminLayout>
  );
};
export default AdminEvents;

