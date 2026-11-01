import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FolderGit2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  ExternalLink,
  Github,
  Star,
  Loader2,
  AlertCircle,
  Eye,
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
  getAllProjectsAdmin,
  createProjectAdmin,
  updateProjectAdmin,
  deleteProjectAdmin,
  uploadStorageFile,
} from "@/lib/adminService";
import type { ProjectItem, PublicationStatus } from "@/types";

export const AdminProjects: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // Dialogs
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologiesStr: "React, TypeScript, Tailwind CSS",
    github_url: "",
    cover_image: "",
    publication_status: "published" as PublicationStatus,
    is_featured: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllProjectsAdmin(search, status);
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects", err);
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
    setEditingProject(null);
    setFormData({
      title: "",
      description: "",
      technologiesStr: "React, TypeScript, Tailwind CSS",
      github_url: "https://github.com/fossceprn/",
      cover_image: "",
      publication_status: "published",
      is_featured: false,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      technologiesStr: (project.technologies || []).join(", "),
      github_url: project.github_url || "",
      cover_image: project.cover_image || "",
      publication_status: project.publication_status,
      is_featured: project.is_featured || false,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    try {
      const publicUrl = await uploadStorageFile("project-images", file, "projects");
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
      const techList = formData.technologiesStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        description: formData.description,
        github_url: formData.github_url,
        cover_image: formData.cover_image,
        technologies: techList,
        publication_status: formData.publication_status,
        is_featured: formData.is_featured,
      };

      if (editingProject) {
        await updateProjectAdmin(editingProject.id, payload);
      } else {
        await createProjectAdmin(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProjectAdmin(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error("Error deleting project", err);
    }
  };

  const handleTogglePublish = async (project: ProjectItem) => {
    const nextStatus: PublicationStatus =
      project.publication_status === "published" ? "draft" : "published";
    try {
      await updateProjectAdmin(project.id, { publication_status: nextStatus });
      loadData();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <AdminLayout
      title="Project Management"
      subtitle="Showcase open source repositories, student tools, and featured campus utilities."
      actions={
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </Button>
      }
    >
      {/* Search & Filter Bar */}
      <Card className="p-4 border border-slate-200/80 bg-white rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search projects..."
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
              <option value="all">All Projects</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Technologies</th>
                <th className="py-3 px-4">GitHub</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading projects...</span>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <FolderGit2 className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No projects found</p>
                    <p className="text-[11px]">
                      {search || status !== "all"
                        ? "Try clearing filters."
                        : "Click 'Add Project' to showcase your first student repository."}
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Project Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.cover_image ? (
                          <img
                            src={p.cover_image}
                            alt=""
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <FolderGit2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate max-w-[220px]">
                              {p.title}
                            </span>
                            {p.is_featured && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Technologies */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.technologies?.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                        {(p.technologies?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{(p.technologies?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* GitHub Link */}
                    <td className="py-3 px-4">
                      {p.github_url ? (
                        <a
                          href={p.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-600"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Repo</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.publication_status === "published"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Click to toggle status"
                      >
                        {p.publication_status === "published" ? "Published" : "Draft"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Project"
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

      {/* CREATE / EDIT PROJECT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingProject ? "Edit Project" : "Add Student Project"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Publish student-built tools and open-source applications to inspire contributions.
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
                Project Title *
              </label>
              <Input
                required
                placeholder="e.g. CEPrn Campus Navigation & Bus Tracker"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Repository URL
              </label>
              <Input
                placeholder="https://github.com/fossceprn/repository"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technologies (comma-separated) *
              </label>
              <Input
                required
                placeholder="React, TypeScript, Tailwind CSS, OpenStreetMap"
                value={formData.technologiesStr}
                onChange={(e) => setFormData({ ...formData, technologiesStr: e.target.value })}
                className="h-9 text-xs rounded-xl font-mono"
              />
            </div>

            {/* Cover Image Upload / URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Project Cover / Screenshot
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
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    placeholder="https://... or upload screenshot"
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
                    <span>Upload</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="What does the project do? How can students contribute?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
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
                  <option value="published">Published (Live on Public Site)</option>
                  <option value="draft">Draft (Admin Only)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured_check"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="featured_check" className="text-xs font-semibold text-slate-700">
                  Highlight as Featured Project
                </label>
              </div>
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
                {saving ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
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
            <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This repository listing will be permanently removed from Supabase and the public website.
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
export default AdminProjects;

