import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  UserCheck,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Github,
  Linkedin,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  Inbox,
  Check,
  X,
  Mail,
  GraduationCap,
  KeyRound,
  Copy,
  CheckCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getAllExecomAdmin,
  createExecomMember,
  updateExecomMember,
  deleteExecomMember,
  uploadStorageFile,
  reorderExecomMembers,
  getExecomApplications,
  updateExecomApplicationStatus,
  promoteApplicationToExecom,
  deleteExecomApplication,
  provisionExecomCredentials,
} from "@/lib/adminService";
import {
  getMembershipOpenStatus,
  setMembershipOpenStatus,
  findAssignedCredential,
} from "@/lib/credentialsService";
import type {
  ExecomMember,
  ExecomApplication,
  ExecomApplicationStatus,
  AdminRole,
} from "@/types";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
];

const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

function generateSecurePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "Foss";
  for (let i = 0; i < 4; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += "@" + Math.floor(100 + Math.random() * 900);
  return pwd;
}

export const AdminExecom: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "applied" ? "applied" : "active";

  const [members, setMembers] = useState<ExecomMember[]>([]);
  const [applications, setApplications] = useState<ExecomApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Membership Applications Open / Closed state
  const [isMembershipOpen, setIsMembershipOpen] = useState(true);
  const [togglingMembership, setTogglingMembership] = useState(false);

  // Filter & search for applications
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");

  // Active Member Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ExecomMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Credentials Provisioning Modal State
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credMember, setCredMember] = useState<ExecomMember | null>(null);
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credRole, setCredRole] = useState<AdminRole>("editor");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [credFeedback, setCredFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [provisionedRecord, setProvisionedRecord] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Application details modal state
  const [selectedApplication, setSelectedApplication] =
    useState<ExecomApplication | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [provisionOnAccept, setProvisionOnAccept] = useState(true);
  const [acceptPassword, setAcceptPassword] = useState("Foss@2026");
  const [isPromoting, setIsPromoting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Active member Form state
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    department: "Computer Science & Engineering",
    semester: "S7",
    email: "",
    login_password: "",
    photo_url: "",
    github_url: "",
    linkedin_url: "",
    display_order: 1,
    is_active: true,
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [membersData, appsData, membershipStatus] = await Promise.all([
        getAllExecomAdmin(),
        getExecomApplications(),
        getMembershipOpenStatus(),
      ]);
      setMembers(membersData);
      setApplications(appsData);
      setIsMembershipOpen(membershipStatus);
    } catch (err) {
      console.error("Error loading ExeCom data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMembership = async () => {
    const nextState = !isMembershipOpen;
    const confirmMsg = nextState
      ? "Are you sure you want to OPEN Execom Membership applications? Students will be able to submit their details on the public site."
      : "Are you sure you want to CLOSE Execom Membership applications? The public form will be replaced with a closure notice.";

    if (!confirm(confirmMsg)) return;

    try {
      setTogglingMembership(true);
      await setMembershipOpenStatus(nextState);
      setIsMembershipOpen(nextState);
    } catch (err: any) {
      alert("Failed to update membership status: " + err.message);
    } finally {
      setTogglingMembership(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({ tab: currentTab });
    }
  }, [searchParams]);

  // Tab switcher
  const setTab = (tab: "active" | "applied") => {
    setSearchParams({ tab });
  };

  // --------------------------------------------------------------------------
  // ACTIVE MEMBERS LOGIC
  // --------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      full_name: "",
      designation: "",
      department: "Computer Science & Engineering",
      semester: "S7",
      email: "",
      login_password: generateSecurePassword(),
      photo_url: "",
      github_url: "",
      linkedin_url: "",
      display_order: members.length + 1,
      is_active: true,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (member: ExecomMember) => {
    setEditingMember(member);
    const existingCred =
      findAssignedCredential(member.email || "") ||
      findAssignedCredential(member.full_name);

    setFormData({
      full_name: member.full_name,
      designation: member.designation,
      department: member.department,
      semester: member.semester || "S7",
      email: member.email || "",
      login_password: member.login_password || existingCred?.password || "",
      photo_url: member.photo_url || "",
      github_url: member.github_url || "",
      linkedin_url: member.linkedin_url || "",
      display_order: member.display_order,
      is_active: member.is_active,
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
      const publicUrl = await uploadStorageFile("avatars", file, "execom");
      setFormData((prev) => ({ ...prev, photo_url: publicUrl }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo to Supabase Storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      if (editingMember) {
        await updateExecomMember(editingMember.id, formData);
      } else {
        await createExecomMember(formData);
      }
      setModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save ExeCom member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteExecomMember(id);
      setDeleteConfirmId(null);
      await loadAllData();
    } catch (err: any) {
      alert("Error deleting member: " + err.message);
    }
  };

  const handleToggleActive = async (member: ExecomMember) => {
    try {
      await updateExecomMember(member.id, { is_active: !member.is_active });
      await loadAllData();
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === members.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newMembers = [...members];
    const temp = newMembers[index];
    newMembers[index] = newMembers[targetIndex];
    newMembers[targetIndex] = temp;

    const reorderedList = newMembers.map((m, idx) => ({
      ...m,
      display_order: idx + 1,
    }));

    setMembers(reorderedList);

    try {
      await reorderExecomMembers(
        reorderedList.map((m) => ({ id: m.id, display_order: m.display_order }))
      );
    } catch (err: any) {
      console.error("Failed to persist order", err);
      loadAllData();
    }
  };

  // --------------------------------------------------------------------------
  // CREDENTIALS PROVISIONING LOGIC
  // --------------------------------------------------------------------------
  const handleOpenCredentialsModal = (member: ExecomMember) => {
    setCredMember(member);
    const isAmal = member.full_name.toLowerCase().includes("amal");
    const existingCred = member.email
      ? findAssignedCredential(member.email)
      : isAmal
      ? (findAssignedCredential("amaldev@fossceprn") || findAssignedCredential("amal"))
      : undefined;

    const cleanName = member.full_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "coordinator";
    const suggestedEmail =
      existingCred?.email ||
      member.email ||
      (isAmal
        ? "amaldev@fossceprn.com"
        : `${cleanName}@fossceprn.com`);

    setCredEmail(suggestedEmail);
    setCredPassword(existingCred?.password || generateSecurePassword());
    setCredRole((existingCred?.role as AdminRole) || (member.role as AdminRole) || "editor");
    setCredFeedback(null);
    setProvisionedRecord(null);
    setCopiedSuccess(false);
    setCredModalOpen(true);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credMember) return;

    setIsProvisioning(true);
    setCredFeedback(null);

    try {
      const res = await provisionExecomCredentials({
        execomId: credMember.id,
        fullName: credMember.full_name,
        email: credEmail,
        password: credPassword,
        role: credRole,
      });

      if (res.success) {
        setProvisionedRecord({
          fullName: credMember.full_name,
          email: credEmail,
          password: credPassword,
          role: credRole,
        });
        setCredFeedback({
          type: "success",
          message: res.message,
        });
        await loadAllData();
      }
    } catch (err: any) {
      console.error("Provisioning error:", err);
      setCredFeedback({
        type: "error",
        message: err.message || "Failed to provision login credentials.",
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisionedRecord) return;
    const text = `FOSS CEPrn — ExeCom Dashboard Credentials
Name: ${provisionedRecord.fullName}
Email / User ID: ${provisionedRecord.email}
Password: ${provisionedRecord.password}
Role: ${provisionedRecord.role.toUpperCase()}
Dashboard URL: ${window.location.origin}/execom/login (or ${window.location.origin}/login)`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // --------------------------------------------------------------------------
  // APPLICATIONS LOGIC
  // --------------------------------------------------------------------------
  const handleOpenAppDetails = (app: ExecomApplication) => {
    setSelectedApplication(app);
    setAdminNotesInput(app.admin_notes || "");
    setAcceptPassword(generateSecurePassword());
    setProvisionOnAccept(true);
    setActionFeedback(null);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: ExecomApplicationStatus
  ) => {
    try {
      await updateExecomApplicationStatus(id, newStatus, adminNotesInput);
      setActionFeedback(`Application marked as ${newStatus}.`);
      await loadAllData();
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) =>
          prev ? { ...prev, status: newStatus, admin_notes: adminNotesInput } : null
        );
      }
    } catch (err: any) {
      alert("Error updating application status: " + err.message);
    }
  };

  const handlePromoteToExecom = async (app: ExecomApplication) => {
    if (
      !confirm(
        `Are you sure you want to accept ${app.full_name} and add them to the official ExeCom team as "${app.desired_role}"?`
      )
    ) {
      return;
    }

    setIsPromoting(true);
    try {
      // 1. Promote to execom_members
      const newMember = await promoteApplicationToExecom(app);

      // 2. Provision credentials if enabled
      if (provisionOnAccept) {
        await provisionExecomCredentials({
          execomId: newMember.id,
          fullName: app.full_name,
          email: app.email,
          password: acceptPassword,
          role: "editor",
        });
      }

      setActionFeedback(
        `Promoted ${app.full_name} to ExeCom${
          provisionOnAccept
            ? ` and generated dashboard credentials (${app.email})!`
            : "!"
        }`
      );
      await loadAllData();
      setSelectedApplication(null);
      setTimeout(() => setTab("active"), 1200);
    } catch (err: any) {
      alert("Failed to promote candidate: " + err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this application?")) {
      return;
    }
    try {
      await deleteExecomApplication(id);
      setSelectedApplication(null);
      await loadAllData();
    } catch (err: any) {
      alert("Failed to delete application: " + err.message);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.full_name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.department.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.desired_role.toLowerCase().includes(appSearch.toLowerCase());

    const matchesStatus =
      appStatusFilter === "all" || app.status === appStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingAppsCount = applications.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout
      title="ExeCom & Leadership Management"
      subtitle="Manage official chapter leads, designations, credentials, team cards, and review applied leadership candidates."
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Membership Status Control */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isMembershipOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className={isMembershipOpen ? "text-emerald-700" : "text-red-700"}>
                {isMembershipOpen ? "Membership Open" : "Membership Closed"}
              </span>
            </span>
            <Button
              size="sm"
              variant={isMembershipOpen ? "outline" : "default"}
              onClick={handleToggleMembership}
              disabled={togglingMembership}
              className={`h-7 px-2.5 text-[11px] font-bold ${
                isMembershipOpen
                  ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {togglingMembership
                ? "Updating..."
                : isMembershipOpen
                ? "Close Membership"
                : "Open Membership"}
            </Button>
          </div>

          {currentTab === "active" ? (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add ExeCom Member</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Pending Candidates:{" "}
                <strong className="text-emerald-700">{pendingAppsCount}</strong>
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                currentTab === "active"
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Active ExeCom Members</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
                {members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("applied")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                currentTab === "applied"
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Applied ExeCom List</span>
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${
                  pendingAppsCount > 0
                    ? "bg-amber-100 text-amber-800 font-bold animate-pulse"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {applications.length}
              </span>
              {pendingAppsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 right-1" />
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:block">
            {currentTab === "active"
              ? "Official Executive Committee displayed on /execom"
              : "Students who applied to join ExeCom via portal"}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: ACTIVE EXECOM MEMBERS */}
        {/* ------------------------------------------------------------------ */}
        {currentTab === "active" && (
          <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4 w-14">Order</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Department & Sem</th>
                    <th className="py-3 px-4">Dashboard Access</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading ExeCom members...</span>
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">No ExeCom members configured</p>
                        <p className="text-[11px]">
                          Add the chapter lead, vice lead, technical heads, and team coordinators.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    members.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Order Controls */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-600">
                            <span>{member.display_order}</span>
                            <div className="flex flex-col">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveOrder(idx, "up")}
                                className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={idx === members.length - 1}
                                onClick={() => handleMoveOrder(idx, "down")}
                                className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Member details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border border-slate-200">
                              <AvatarImage
                                src={member.photo_url || ""}
                                alt={member.full_name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                                {member.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{member.full_name}</p>
                              {member.email && (
                                <p className="text-[11px] text-slate-500 font-mono">{member.email}</p>
                              )}
                              <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                                {member.github_url && (
                                  <a
                                    href={member.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-slate-700"
                                    title="GitHub Profile"
                                  >
                                    <Github className="w-3 h-3" />
                                  </a>
                                )}
                                {member.linkedin_url && (
                                  <a
                                    href={member.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-blue-600"
                                    title="LinkedIn Profile"
                                  >
                                    <Linkedin className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Designation */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{member.designation}</span>
                        </td>

                        {/* Department & Sem */}
                        <td className="py-3 px-4 text-slate-600">
                          <p className="font-medium truncate max-w-[200px]">{member.department}</p>
                          <span className="text-[11px] text-slate-400">{member.semester}</span>
                        </td>

                        {/* Dashboard Access Status */}
                        <td className="py-3 px-4">
                          {member.user_id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <KeyRound className="w-3 h-3 text-emerald-600" />
                                <span className="capitalize">{member.role || "Editor"}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                              <span>No Login Issued</span>
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(member)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                              member.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{member.is_active ? "Active" : "Archived"}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Assign Credentials Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCredentialsModal(member)}
                              className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Assign User ID and Password for ExeCom Login"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">
                                {member.user_id ? "Change Key" : "Assign Key"}
                              </span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(member)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              title="Edit Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(member.id)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: APPLIED EXECOM CANDIDATES LIST */}
        {/* ------------------------------------------------------------------ */}
        {currentTab === "applied" && (
          <div className="space-y-4">
            {/* Membership Closed Notice Banner */}
            {!isMembershipOpen && (
              <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span>
                    <strong>Membership Applications are Currently Closed.</strong> New student submissions via the Execom Membership Interest Form are disabled.
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleToggleMembership}
                  disabled={togglingMembership}
                  className="bg-red-600 hover:bg-red-700 text-white text-[11px] h-7 font-bold shrink-0"
                >
                  Re-Open Membership
                </Button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, email, department, or role..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {(["all", "pending", "reviewed", "accepted", "rejected"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAppStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                        appStatusFilter === st
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Applications Table */}
            <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Desired Role</th>
                      <th className="py-3 px-4">Department & Sem</th>
                      <th className="py-3 px-4">Statement of Purpose</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Applied On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          <span>Loading ExeCom applications...</span>
                        </td>
                      </tr>
                    ) : filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-semibold text-slate-600">No ExeCom applications found</p>
                          <p className="text-[11px]">
                            {appSearch || appStatusFilter !== "all"
                              ? "Try clearing filters to see all applications."
                              : "Student submissions from the Execom Membership Interest Form will appear here."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => {
                        const statusColors: Record<string, string> = {
                          pending: "bg-amber-50 text-amber-800 border-amber-200",
                          reviewed: "bg-blue-50 text-blue-800 border-blue-200",
                          accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
                          rejected: "bg-rose-50 text-rose-800 border-rose-200",
                        };

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Applicant Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                  {app.full_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{app.full_name}</p>
                                  <p className="text-[11px] text-slate-500 font-mono">{app.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {app.github_url && (
                                      <a
                                        href={app.github_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-slate-400 hover:text-slate-800"
                                        title="GitHub Profile"
                                      >
                                        <Github className="w-3 h-3" />
                                      </a>
                                    )}
                                    {app.linkedin_url && (
                                      <a
                                        href={app.linkedin_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-slate-400 hover:text-blue-600"
                                        title="LinkedIn Profile"
                                      >
                                        <Linkedin className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Desired Role */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                                {app.desired_role}
                              </span>
                            </td>

                            {/* Department & Semester */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <p className="font-medium truncate max-w-[170px]">{app.department}</p>
                              <span className="text-[11px] text-slate-400 font-semibold">{app.semester}</span>
                            </td>

                            {/* Statement of purpose */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                                {app.statement_of_purpose}
                              </p>
                            </td>

                            {/* Status badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                                  statusColors[app.status] || "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {app.status === "pending" && <Clock className="w-3 h-3" />}
                                {app.status === "accepted" && <Check className="w-3 h-3" />}
                                {app.status === "rejected" && <X className="w-3 h-3" />}
                                <span>{app.status}</span>
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {new Date(app.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenAppDetails(app)}
                                  className="h-8 px-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold"
                                  title="View Full Application"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Review</span>
                                </Button>

                                {app.status !== "accepted" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePromoteToExecom(app)}
                                    className="h-8 px-2 text-xs text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 gap-1 font-semibold"
                                    title="Accept and Add to ExeCom"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 1: PROVISION LOGIN CREDENTIALS DIALOG */}
        {/* ------------------------------------------------------------------ */}
        {credModalOpen && credMember && (
          <Dialog open={credModalOpen} onOpenChange={setCredModalOpen}>
            <DialogContent className="max-w-md p-6 bg-white rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-600 pb-1">
                  <KeyRound className="w-5 h-5" />
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Assign ExeCom Login Credentials
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Provision or update login access for{" "}
                  <strong className="text-slate-800">{credMember.full_name}</strong> (
                  {credMember.designation}).
                </DialogDescription>
              </DialogHeader>

              {credFeedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
                    credFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {credFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{credFeedback.message}</span>
                </div>
              )}

              {provisionedRecord ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Credentials Ready to Share
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                        {provisionedRecord.role}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          User ID / Login Email:
                        </span>
                        <p className="font-mono font-bold text-slate-900 select-all">
                          {provisionedRecord.email}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Password:
                        </span>
                        <p className="font-mono font-bold text-slate-900 select-all">
                          {provisionedRecord.password}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Login Portal:
                        </span>
                        <Link
                          to="/execom/login"
                          target="_blank"
                          className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          /execom/login <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCredModalOpen(false)}
                      className="text-xs"
                    >
                      Close
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyCredentials}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                    >
                      {copiedSuccess ? (
                        <>
                          <CheckCheck className="w-4 h-4" />
                          <span>Copied Details!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy All Credentials</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProvisionSubmit} noValidate className="space-y-4 pt-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Login Email / User ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        value={credEmail}
                        onChange={(e) => setCredEmail(e.target.value)}
                        placeholder="e.g. amaldev@fossceprn or username"
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setCredPassword(generateSecurePassword())}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Generate Password
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        value={credPassword}
                        onChange={(e) => setCredPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="pl-9 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Dashboard Access Privilege Level *
                    </label>
                    <select
                      value={credRole}
                      onChange={(e) => setCredRole(e.target.value as AdminRole)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                    >
                      <option value="editor">
                        Editor (Can manage Events, Projects, Gallery, and Announcements)
                      </option>
                      <option value="admin">
                        Admin (Full content control + Member management)
                      </option>
                      <option value="lead">
                        Chapter Lead (Executive content & coordinator privileges)
                      </option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                    Once assigned, the ExeCom coordinator will be able to log in at{" "}
                    <code className="text-emerald-700 font-semibold">/execom/login</code> or{" "}
                    <code className="text-emerald-700 font-semibold">/admin/login</code> to access
                    their dashboard view.
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCredModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isProvisioning}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isProvisioning ? "Provisioning..." : "Provision Login"}</span>
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 2: ADD / EDIT ACTIVE MEMBER */}
        {/* ------------------------------------------------------------------ */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingMember ? "Edit ExeCom Member" : "Add New ExeCom Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Configure student executive leadership member details and official role.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Designation / Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Chapter Lead"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Coordinator Email
                  </label>
                  <Input
                    type="email"
                    placeholder="coordinator@perumonec.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Login Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Coordinator Login Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, login_password: generateSecurePassword() })
                    }
                    className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Enter coordinator login password"
                    value={formData.login_password || ""}
                    onChange={(e) => setFormData({ ...formData, login_password: e.target.value })}
                    className="pl-9 h-9 text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saved directly to database. Coordinators can sign in with this password and their email or user ID.
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Photo
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Avatar className="w-12 h-12 border border-slate-200 shrink-0">
                    <AvatarImage src={formData.photo_url} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
                      {formData.full_name ? formData.full_name.charAt(0) : "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? "Uploading..." : "Upload Avatar"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">Square photo recommended</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    LinkedIn URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {saving ? "Saving..." : editingMember ? "Save Changes" : "Create ExeCom Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 3: APPLICATION REVIEW & PROMOTION */}
        {/* ------------------------------------------------------------------ */}
        {selectedApplication && (
          <Dialog
            open={Boolean(selectedApplication)}
            onOpenChange={() => setSelectedApplication(null)}
          >
            <DialogContent className="max-w-2xl p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      ExeCom Application Review
                    </DialogTitle>
                  </div>
                  <Badge className="capitalize text-xs font-semibold">
                    {selectedApplication.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 pt-1">
                  Submitted on{" "}
                  {new Date(selectedApplication.created_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </DialogDescription>
              </DialogHeader>

              {actionFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
              )}

              <div className="space-y-4 pt-2 text-xs">
                {/* Candidate Summary Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Candidate Name</span>
                    <p className="font-bold text-sm text-slate-900">{selectedApplication.full_name}</p>
                    <p className="text-slate-600 font-mono mt-0.5">{selectedApplication.email}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Position Applied For</span>
                    <p className="font-bold text-sm text-emerald-700">{selectedApplication.desired_role}</p>
                    <p className="text-slate-600 mt-0.5">
                      {selectedApplication.department} · {selectedApplication.semester}
                    </p>
                  </div>
                </div>

                {/* Profiles & Contact */}
                <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="font-semibold text-slate-700">Online Profiles:</span>
                  {selectedApplication.github_url ? (
                    <a
                      href={selectedApplication.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-medium"
                    >
                      <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No GitHub provided</span>
                  )}

                  {selectedApplication.linkedin_url ? (
                    <a
                      href={selectedApplication.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No LinkedIn provided</span>
                  )}
                </div>

                {/* Statement of Purpose */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-1">
                    Motivation & Statement of Purpose:
                  </span>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedApplication.statement_of_purpose}
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Internal Admin Notes / Feedback:
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Add interview notes, committee feedback, or onboarding details..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                {/* Credentials Provisioning Toggle on Accept */}
                {selectedApplication.status !== "accepted" && (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={provisionOnAccept}
                        onChange={(e) => setProvisionOnAccept(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-900">
                        Automatically provision ExeCom Dashboard login credentials upon acceptance
                      </span>
                    </label>

                    {provisionOnAccept && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 block">User Email / ID:</span>
                          <span className="font-mono font-semibold text-slate-800">{selectedApplication.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Initial Password:</span>
                          <input
                            type="text"
                            value={acceptPassword}
                            onChange={(e) => setAcceptPassword(e.target.value)}
                            className="font-mono text-xs px-2 py-1 border border-slate-200 rounded bg-white w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteApplication(selectedApplication.id)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Application
                  </Button>

                  <div className="flex items-center gap-2">
                    {selectedApplication.status !== "reviewed" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selectedApplication.id, "reviewed")}
                        className="text-xs"
                      >
                        Mark Reviewed
                      </Button>
                    )}

                    {selectedApplication.status !== "rejected" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selectedApplication.id, "rejected")}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      disabled={isPromoting || selectedApplication.status === "accepted"}
                      onClick={() => handlePromoteToExecom(selectedApplication)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {selectedApplication.status === "accepted"
                          ? "Already in ExeCom"
                          : isPromoting
                          ? "Adding..."
                          : "Accept & Add to ExeCom"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* DELETE CONFIRM DIALOG FOR ACTIVE MEMBER */}
        {/* ------------------------------------------------------------------ */}
        {deleteConfirmId && (
          <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent className="max-w-sm p-6 bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete ExeCom Member?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  This action cannot be undone. The member profile card will be permanently removed.
                </DialogDescription>
              </DialogHeader>

              <div className="pt-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => handleDeleteMember(deleteConfirmId)}
                >
                  Delete Permanently
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminExecom;
