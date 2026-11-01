import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Calendar,
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
  getAllAnnouncementsAdmin,
  createAnnouncementAdmin,
  updateAnnouncementAdmin,
  deleteAnnouncementAdmin,
} from "@/lib/adminService";
import type { AnnouncementItem, PublicationStatus } from "@/types";

export const AdminAnnouncements: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    publication_status: "published" as PublicationStatus,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (err) {
      console.error("Error loading announcements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      content: "",
      category: "General",
      publication_status: "published",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category || "General",
      publication_status: item.publication_status || "published",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      if (editingItem) {
        await updateAnnouncementAdmin(editingItem.id, formData);
      } else {
        await createAnnouncementAdmin(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(
        err.message ||
        "Failed to save announcement. (Ensure the Phase 2 SQL migration has been executed in Supabase SQL Editor)."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncementAdmin(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error("Error deleting announcement", err);
    }
  };

  const handleTogglePublish = async (item: AnnouncementItem) => {
    const nextStatus: PublicationStatus =
      item.publication_status === "published" ? "draft" : "published";
    try {
      await updateAnnouncementAdmin(item.id, { publication_status: nextStatus });
      loadData();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <AdminLayout
      title="Announcement Management"
      subtitle="Publish community broadcasts, upcoming deadline alerts, and chapter news."
      actions={
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </Button>
      }
    >
      {/* Announcements List */}
      <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading announcements...</span>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Megaphone className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No announcements posted</p>
                    <p className="text-[11px]">
                      Broadcast news, workshop schedules, and updates to chapter members.
                    </p>
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title & Preview */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md mt-0.5">
                          {item.content}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${item.publication_status === "published"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        title="Click to toggle status"
                      >
                        {item.publication_status === "published" ? "Published" : "Draft"}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete"
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

      {/* CREATE / EDIT ANNOUNCEMENT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingItem ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Broadcast information to student members and public website visitors.
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
                Announcement Title *
              </label>
              <Input
                required
                placeholder="e.g. Registrations Open for Hacktoberfest 2026!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-9 w-full px-3 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="General">General News</option>
                  <option value="Workshops">Workshops & Events</option>
                  <option value="Hackathon">Hackathons</option>
                  <option value="Important">Important Alert</option>
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
                  <option value="published">Published (Visible on site)</option>
                  <option value="draft">Draft (Saved only)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Content / Announcement Body *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Write the full announcement message, dates, prerequisites, and instructions..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Publish Announcement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PREVIEW ANNOUNCEMENT DIALOG */}
      <Dialog open={Boolean(previewItem)} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          {previewItem && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-100">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {previewItem.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{previewItem.title}</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Posted on {new Date(previewItem.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {previewItem.content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Announcement?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This announcement will be removed from Supabase and the public website.
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
export default AdminAnnouncements;