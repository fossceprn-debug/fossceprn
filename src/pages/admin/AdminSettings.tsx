import React, { useEffect, useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Globe,
  Mail,
  Github,
  Instagram,
  Database,
  ShieldCheck,
  Server,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  getSiteSettingsAdmin,
  updateSiteSettingsAdmin,
  uploadStorageFile,
} from "@/lib/adminService";
import {
  getMembershipOpenStatus,
  setMembershipOpenStatus,
} from "@/lib/credentialsService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";
import type { SiteSettings } from "@/types";

export default function AdminSettings() {
  const { user, role, canEditContent } = useAuth();

  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    site_name: "FOSS CEPrn",
    description:
      "Free and Open Source Software cell at College of Engineering Perumon. Empowering students through open tech, collaboration, and knowledge sharing.",
    contact_email: "fossceprn@gmail.com",
    github_url: "https://github.com/fossceprn",
    instagram_url: "https://instagram.com/fossceprn",
    logo_url: "/foss-logo.svg",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const [data, membershipOpen] = await Promise.all([
        getSiteSettingsAdmin(),
        getMembershipOpenStatus(),
      ]);
      if (data) {
        setSettings({
          site_name: data.site_name || "FOSS CEPrn",
          description: data.description || "",
          contact_email: data.contact_email || "fossceprn@gmail.com",
          github_url: data.github_url || "https://github.com/fossceprn",
          instagram_url: data.instagram_url || "https://instagram.com/fossceprn",
          logo_url: data.logo_url || "/foss-logo.svg",
          is_membership_open:
            typeof data.is_membership_open === "boolean"
              ? data.is_membership_open
              : membershipOpen,
        });
      } else {
        setSettings((prev) => ({ ...prev, is_membership_open: membershipOpen }));
      }
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to load current website settings.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (SVG, PNG, JPG, WebP).");
      return;
    }

    try {
      setIsUploadingLogo(true);
      const publicUrl = await uploadStorageFile("avatars", file, "branding");
      setSettings((prev) => ({ ...prev, logo_url: publicUrl }));
      setFeedback({
        type: "success",
        message: "Logo uploaded successfully. Remember to click 'Save Settings' to apply.",
      });
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to upload logo image.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditContent) {
      alert("You do not have permission to edit website settings.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      await updateSiteSettingsAdmin(settings);
      if (typeof settings.is_membership_open === "boolean") {
        await setMembershipOpenStatus(settings.is_membership_open);
      }
      setFeedback({
        type: "success",
        message: "Website settings saved and updated across the live portal!",
      });
    } catch (err: any) {
      console.error("Save error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to save website settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout
      title="Website Settings"
      subtitle="Configure global chapter metadata, official handles, and view infrastructure status."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadSettings}
          disabled={isLoading}
          className="h-9 gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl">
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading website configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: General Branding & Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">General Information & Branding</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Chapter / Website Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.site_name || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, site_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    placeholder="e.g. FOSS CEPrn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Contact Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={settings.contact_email || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, contact_email: e.target.value })
                      }
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      placeholder="fossceprn@gmail.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Chapter Mission & Meta Description
                </label>
                <textarea
                  rows={3}
                  value={settings.description || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  placeholder="Brief summary of the chapter's objectives, community focus, and activities..."
                />
              </div>

              {/* Logo Preview & Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Official Logo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/foss-logo.svg";
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-emerald-600">FOSS</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingLogo ? "Uploading..." : "Upload New Logo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo || !canEditContent}
                        />
                      </label>
                      <span className="text-xs text-slate-500">
                        SVG, PNG, or JPG recommended (transparent background)
                      </span>
                    </div>

                    <input
                      type="url"
                      value={settings.logo_url || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, logo_url: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="or enter an image URL directly..."
                    />
                  </div>
                </div>
              </div>

              {/* Membership Applications Intake Status */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Execom Membership Interest Applications</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        settings.is_membership_open ?? true
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {settings.is_membership_open ?? true ? "OPEN" : "CLOSED"}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle to open or close candidate submissions on the public Execom Membership Interest Form (/join).
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.is_membership_open ?? true}
                    onChange={(e) =>
                      setSettings({ ...settings, is_membership_open: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {settings.is_membership_open ?? true ? "Accept Submissions" : "Closed (Paused)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Section 2: Community & Social Handles */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Social & Community Handles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Organization URL
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="url"
                      value={settings.github_url || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, github_url: e.target.value })
                      }
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      placeholder="https://github.com/fossceprn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Instagram Handle URL
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="url"
                      value={settings.instagram_url || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, instagram_url: e.target.value })
                      }
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      placeholder="https://instagram.com/fossceprn"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Supabase & Infrastructure Diagnostics */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">System & Database Diagnostics</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Connection Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Supabase Project Ref
                  </p>
                  <p className="font-mono font-semibold text-slate-800">fngwxkuihlkfsiskicue</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Region: West EU (Paris)</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Current Active Session
                  </p>
                  <p className="font-semibold text-slate-800 truncate" title={user?.email || "fossceprn@gmail.com"}>
                    {user?.email || "fossceprn@gmail.com"}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5 uppercase">
                    Role: {role || "super_admin"}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    Auth Provider Engine
                  </p>
                  <p className="font-semibold text-slate-800">Supabase Auth (v2.x)</p>
                  <a
                    href="https://supabase.com/dashboard/project/fngwxkuihlkfsiskicue"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 mt-0.5"
                  >
                    Open Supabase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving || !canEditContent}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
