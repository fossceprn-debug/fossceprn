import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Maximize2,
  Calendar,
  Loader2,
  AlertCircle,
  Tag,
  CheckCircle,
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
  getAllGalleryAdmin,
  createGalleryItemAdmin,
  updateGalleryItemAdmin,
  deleteGalleryItemAdmin,
  uploadStorageFile,
  getAllEventsAdmin,
} from "@/lib/adminService";
import type { GalleryItem, EventItem } from "@/types";

const CATEGORIES = [
  "Sessions",
  "Workshops",
  "Hackathons",
  "Meetups",
  "Celebrations",
  "General",
];

export const AdminGallery: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState("all");

  // Dialogs
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    description: "",
    category: "Sessions",
    event_id: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [g, e] = await Promise.all([
        getAllGalleryAdmin(category),
        getAllEventsAdmin(),
      ]);
      setPhotos(g);
      setEvents(e);
    } catch (err) {
      console.error("Error loading gallery data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams]);

  const handleOpenCreate = () => {
    setEditingPhoto(null);
    setFormData({
      title: "",
      image_url: "",
      description: "",
      category: "Sessions",
      event_id: "",
    });
    setErrorMsg("");
    setUploadProgress("");
    setModalOpen(true);
  };

  const handleOpenEdit = (photo: GalleryItem) => {
    setEditingPhoto(photo);
    setFormData({
      title: photo.title,
      image_url: photo.image_url,
      description: photo.description || "",
      category: photo.category || "Sessions",
      event_id: photo.event_id || "",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 8MB maximum limit.");
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading image to Supabase Storage bucket 'gallery'...");
    setErrorMsg("");

    try {
      const publicUrl = await uploadStorageFile("gallery", file, "photos");
      setFormData((prev) => ({
        ...prev,
        image_url: publicUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      }));
      setUploadProgress("Upload successful!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo to Supabase.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      setErrorMsg("Please upload an image or provide an image URL.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        title: formData.title,
        image_url: formData.image_url,
        description: formData.description,
        category: formData.category,
        event_id: formData.event_id || null,
      };

      if (editingPhoto) {
        await updateGalleryItemAdmin(editingPhoto.id, payload);
      } else {
        await createGalleryItemAdmin(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save gallery item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGalleryItemAdmin(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error("Error deleting gallery photo", err);
    }
  };

  return (
    <AdminLayout
      title="Gallery Management"
      subtitle="Upload and categorize photographs from chapter events, hackathons, and celebrations."
      actions={
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Photograph</span>
        </Button>
      }
    >
      {/* Category Filter Pills */}
      <Card className="p-4 border border-slate-200/80 bg-white rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                category === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Categories ({photos.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  category === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Storage bucket: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">gallery</code>
          </span>
        </div>
      </Card>

      {/* Photos Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-sm">Loading gallery images...</p>
        </div>
      ) : photos.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3 border border-slate-200/80 bg-white rounded-2xl">
          <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Photographs in Gallery</h3>
          <p className="text-xs max-w-sm mx-auto">
            Upload pictures from workshops, induction ceremonies, and coding sprints to show on the public gallery.
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Photograph</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Photo Area */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-[10px] font-bold shadow-xs">
                    {photo.category}
                  </Badge>
                </div>
                <button
                  onClick={() => setPreviewPhoto(photo)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  title="Expand"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details & Actions */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {photo.title}
                  </h4>
                  {photo.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {photo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(photo)}
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      title="Edit Photo Info"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(photo.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD / EDIT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingPhoto ? "Edit Photograph Details" : "Upload Photograph"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload image file directly to Supabase storage bucket 'gallery' (under 8MB).
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* File Upload Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Image File (Supabase Storage) *
              </label>

              {formData.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-100 group">
                  <img
                    src={formData.image_url}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold gap-1.5">
                    <Upload className="w-4 h-4" />
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 cursor-pointer bg-slate-50/60 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploading ? uploadProgress : "Click to select and upload photograph"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    PNG, JPG, WebP supported up to 8MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Or direct URL input */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1">
                  Or paste direct public Image URL:
                </span>
                <Input
                  placeholder="https://fngwxkuihlkfsiskicue.supabase.co/storage/v1/object/public/gallery/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="h-8 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Title / Caption *
              </label>
              <Input
                required
                placeholder="e.g. Students configuring Git at Linux workshop"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-9 w-full px-3 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Event (Optional)
                </label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  className="h-9 w-full px-3 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="">No linked event</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional notes or photo description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600"
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
                disabled={saving || uploading}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? "Saving..." : editingPhoto ? "Save Changes" : "Publish to Gallery"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FULL IMAGE LIGHTBOX PREVIEW */}
      <Dialog open={Boolean(previewPhoto)} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl p-0 bg-white rounded-2xl overflow-hidden">
          {previewPhoto && (
            <div>
              <div className="bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
                <img
                  src={previewPhoto.image_url}
                  alt={previewPhoto.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="p-5 space-y-1">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  {previewPhoto.category}
                </Badge>
                <h3 className="text-base font-bold text-slate-900">{previewPhoto.title}</h3>
                {previewPhoto.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {previewPhoto.description}
                  </p>
                )}
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
            <h3 className="text-base font-bold text-slate-900">Delete Photograph?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This photograph will be deleted from the Supabase gallery database and public site.
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
export default AdminGallery;

