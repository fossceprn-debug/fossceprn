import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  KeyRound,
  Inbox,
  Copy,
  CheckCheck,
  RefreshCw,
  Sparkles,
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
  getMembersList,
  createMember,
  updateMember,
  deleteMember,
  cleanupDuplicateMembers,
  getMemberApplications,
  approveMemberApplication,
  updateMemberApplicationStatus,
  deleteMemberApplication,
} from "@/lib/adminService";
import type {
  Profile,
  MembershipStatus,
  MemberApplication,
  MemberApplicationStatus,
} from "@/types";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
];

const SEMESTERS = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "Faculty",
  "Alumni",
];

function generateMemberPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "Foss";
  for (let i = 0; i < 4; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += "@" + Math.floor(100 + Math.random() * 900);
  return pwd;
}

export const AdminMembers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "applied" ? "applied" : "directory";

  // Active Members State
  const [members, setMembers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active Member Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Active Member Dialogs
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [viewingMember, setViewingMember] = useState<Profile | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Active Member Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    student_id: "",
    department: DEPARTMENTS[0],
    semester: SEMESTERS[0],
    bio: "",
    github_url: "",
    linkedin_url: "",
    membership_status: "active" as MembershipStatus,
  });

  // --------------------------------------------------------------------------
  // Applied Member Applications State
  // --------------------------------------------------------------------------
  const [appliedList, setAppliedList] = useState<MemberApplication[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [appDeptFilter, setAppDeptFilter] = useState<string>("all");

  // Approval Dialog State
  const [approvalModalApp, setApprovalModalApp] = useState<MemberApplication | null>(null);
  const [approvalPassword, setApprovalPassword] = useState("");
  const [approvalRole, setApprovalRole] = useState("member");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccessDetails, setApprovalSuccessDetails] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, appsRes] = await Promise.all([
        getMembersList({
          search,
          department,
          semester,
          status,
          page,
          pageSize,
        }),
        getMemberApplications(),
      ]);

      setMembers(membersRes.members);
      setTotal(membersRes.total);
      setAppliedList(appsRes);
    } catch (err) {
      console.error("Error loading members data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, department, semester, status, page]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
      setSearchParams({ tab: currentTab });
    }
  }, [searchParams]);

  const setTab = (tab: "directory" | "applied") => {
    setSearchParams({ tab });
  };

  // --------------------------------------------------------------------------
  // DIRECTORY HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      full_name: "",
      email: "",
      student_id: "",
      department: DEPARTMENTS[0],
      semester: SEMESTERS[0],
      bio: "",
      github_url: "",
      linkedin_url: "",
      membership_status: "active",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Profile) => {
    setEditingMember(m);
    setFormData({
      full_name: m.full_name || "",
      email: m.email || "",
      student_id: m.student_id || "",
      department: m.department || DEPARTMENTS[0],
      semester: m.semester || SEMESTERS[0],
      bio: m.bio || "",
      github_url: m.github_url || "",
      linkedin_url: m.linkedin_url || "",
      membership_status: m.membership_status || "active",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      if (editingMember) {
        await updateMember(editingMember.id, formData);
      } else {
        await createMember(formData);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save member details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      setSaving(true);
      await deleteMember(id);
      setDeleteConfirmId(null);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      await loadData();
    } catch (err: any) {
      alert("Error deleting member: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCleanDuplicates = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to clean up duplicate and test user accounts (Abiya Daniel & duplicate handles)?"
    );
    if (!isConfirmed) return;

    try {
      setCleaningDuplicates(true);
      await cleanupDuplicateMembers();
      // Instantly filter out test / duplicate emails from state
      setMembers((prev) =>
        prev.filter((m) => {
          const lowerEmail = (m.email || "").toLowerCase();
          const lowerName = (m.full_name || "").toLowerCase();
          return (
            lowerEmail !== "abiya@fossceprn.com" &&
            lowerEmail !== "hackceprn@gmail.com" &&
            lowerEmail !== "amal@fossceprn" &&
            lowerEmail !== "amaldev@fossceprn" &&
            !lowerName.includes("abiya daniel")
          );
        })
      );
      await loadData();
      alert("Cleanup completed! Removed duplicate and test member accounts.");
    } catch (err: any) {
      alert("Error cleaning duplicate members: " + err.message);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Full Name",
      "Email",
      "Department",
      "Semester",
      "Student ID",
      "Status",
      "GitHub",
      "Joined Date",
    ];

    const rows = members.map((m) => [
      `"${m.full_name || ""}"`,
      `"${m.email || ""}"`,
      `"${m.department || ""}"`,
      `"${m.semester || ""}"`,
      `"${m.student_id || ""}"`,
      `"${m.membership_status || "active"}"`,
      `"${m.github_url || ""}"`,
      `"${new Date(m.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foss-ceprn-members-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------------------------------------------------------------------------
  // APPLIED MEMBERS LOGIC (APPROVAL & CREDENTIALS)
  // --------------------------------------------------------------------------
  const handleOpenApprovalModal = (app: MemberApplication) => {
    setApprovalModalApp(app);
    setApprovalPassword(generateMemberPassword());
    setApprovalRole("member");
    setApprovalNotes(app.admin_notes || "");
    setApprovalSuccessDetails(null);
    setCopiedSuccess(false);
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModalApp) return;

    setIsApproving(true);

    try {
      const res = await approveMemberApplication({
        applicationId: approvalModalApp.id,
        password: approvalPassword,
        role: approvalRole,
        adminNotes: approvalNotes,
      });

      if (res.success) {
        setApprovalSuccessDetails({
          fullName: res.fullName,
          email: res.email,
          password: approvalPassword,
          role: res.role,
        });
        await loadData();
      }
    } catch (err: any) {
      alert("Error approving application: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectApplication = async (id: string) => {
    if (!confirm("Are you sure you want to reject this membership application?")) {
      return;
    }
    try {
      await updateMemberApplicationStatus(id, "rejected");
      await loadData();
      if (approvalModalApp?.id === id) setApprovalModalApp(null);
    } catch (err: any) {
      alert("Failed to reject application: " + err.message);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this application record?")) {
      return;
    }
    try {
      await deleteMemberApplication(id);
      await loadData();
      if (approvalModalApp?.id === id) setApprovalModalApp(null);
    } catch (err: any) {
      alert("Failed to delete application: " + err.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!approvalSuccessDetails) return;
    const text = `FOSS CEPrn — Membership Login Credentials
Welcome to FOSS CEPrn! Your chapter membership account has been approved.

Name: ${approvalSuccessDetails.fullName}
Login Email / ID: ${approvalSuccessDetails.email}
Password: ${approvalSuccessDetails.password}
Assigned Role: ${approvalSuccessDetails.role.toUpperCase()}
Sign-in Portal: ${window.location.origin}/login`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Filtered applications
  const filteredApps = appliedList.filter((app) => {
    const matchesSearch =
      app.full_name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.department.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.interest.toLowerCase().includes(appSearch.toLowerCase());

    const matchesStatus =
      appStatusFilter === "all" || app.status === appStatusFilter;

    const matchesDept =
      appDeptFilter === "all" || app.department === appDeptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const pendingAppsCount = appliedList.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout
      title="Member Management"
      subtitle="View, search, filter, approve student registrations, and manage community profiles."
      actions={
        currentTab === "directory" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanDuplicates}
              disabled={cleaningDuplicates}
              className="h-9 gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
              title="Delete duplicate accounts (Abiya Daniel & duplicate handles)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{cleaningDuplicates ? "Cleaning..." : "Clean Duplicates"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={members.length === 0}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </Button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-medium hidden sm:inline">
            Pending Membership Applications:{" "}
            <strong className="text-emerald-700">{pendingAppsCount}</strong>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("directory")}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                currentTab === "directory"
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Active Members Directory</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
                {total}
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
              <span>Applied Student Members</span>
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${
                  pendingAppsCount > 0
                    ? "bg-amber-100 text-amber-800 font-bold animate-pulse"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {appliedList.length}
              </span>
              {pendingAppsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 right-1" />
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:block">
            {currentTab === "directory"
              ? "Verified profiles enrolled in chapter database"
              : "Submissions from prospective students on /join"}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: ACTIVE MEMBERS DIRECTORY */}
        {/* ------------------------------------------------------------------ */}
        {currentTab === "directory" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <Card className="p-4 border border-slate-200/80 bg-white rounded-2xl shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    placeholder="Search name, email, student ID..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* Department filter */}
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Semester filter */}
                <select
                  value={semester}
                  onChange={(e) => {
                    setSemester(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="all">All Semesters</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Members</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive / Alumni</option>
                </select>
              </div>
            </Card>

            {/* Members Table */}
            <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Department & Sem</th>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          <span>Loading members...</span>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                          <Users className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-semibold text-slate-600">No members found</p>
                          <p className="text-[11px]">
                            {search || department !== "all" || semester !== "all" || status !== "all"
                              ? "Try adjusting search or clearing filters."
                              : "Registered community members will appear here."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-slate-200">
                                <AvatarImage src={m.avatar_url || ""} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                                  {m.full_name ? m.full_name.charAt(0) : "M"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900">{m.full_name || "Unnamed Member"}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{m.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <p className="font-medium truncate max-w-[200px]">{m.department || "General"}</p>
                            <span className="text-[11px] text-slate-400">{m.semester || "Unspecified"}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {m.student_id || "—"}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                m.membership_status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : m.membership_status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.membership_status === "active"
                                    ? "bg-emerald-500"
                                    : m.membership_status === "pending"
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="capitalize">{m.membership_status || "active"}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(m.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingMember(m)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                title="View Member"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(m)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                title="Edit Member"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(m.id)}
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

              {/* Pagination */}
              {total > pageSize && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {Math.min((page - 1) * pageSize + 1, total)} to{" "}
                    {Math.min(page * pageSize, total)} of {total} members
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="font-semibold text-slate-800">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / pageSize)}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: APPLIED STUDENT MEMBERS LIST */}
        {/* ------------------------------------------------------------------ */}
        {currentTab === "applied" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search applicant name, email, department..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {(["all", "pending", "approved", "rejected"] as const).map((st) => (
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
                ))}
              </div>
            </div>

            {/* Applications Table */}
            <Card className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Department & Sem</th>
                      <th className="py-3 px-4">Primary Interest</th>
                      <th className="py-3 px-4">Notes / Background</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Applied Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          <span>Loading membership applications...</span>
                        </td>
                      </tr>
                    ) : filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-semibold text-slate-600">No membership applications found</p>
                          <p className="text-[11px]">
                            {appSearch || appStatusFilter !== "all"
                              ? "Try adjusting search or status filters."
                              : "Prospective student applications submitted on /join will appear here."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => {
                        const statusColors: Record<string, string> = {
                          pending: "bg-amber-50 text-amber-800 border-amber-200",
                          approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
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
                                  {app.github_url && (
                                    <a
                                      href={app.github_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-800 mt-0.5"
                                    >
                                      <Github className="w-3 h-3" /> GitHub
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Department & Semester */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <p className="font-medium truncate max-w-[170px]">{app.department}</p>
                              <span className="text-[11px] text-slate-400 font-semibold">{app.semester}</span>
                            </td>

                            {/* Interest */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold">
                                {app.interest}
                              </span>
                            </td>

                            {/* Notes */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                                {app.notes || "No notes provided"}
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
                                {app.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                {app.status === "rejected" && <XCircle className="w-3 h-3" />}
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
                                {app.status !== "approved" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenApprovalModal(app)}
                                    className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                                    title="Approve & Assign Login Credentials"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    <span>Approve & Issue Key</span>
                                  </Button>
                                ) : (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                  </span>
                                )}

                                {app.status !== "rejected" && app.status !== "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRejectApplication(app.id)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Reject Application"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
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
        {/* APPROVAL & CREDENTIAL PROVISIONING MODAL */}
        {/* ------------------------------------------------------------------ */}
        {approvalModalApp && (
          <Dialog
            open={Boolean(approvalModalApp)}
            onOpenChange={() => setApprovalModalApp(null)}
          >
            <DialogContent className="max-w-md p-6 bg-white rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-600 pb-1">
                  <UserPlus className="w-5 h-5" />
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Approve Membership & Issue Login
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Activate chapter membership and generate login credentials for{" "}
                  <strong className="text-slate-800">{approvalModalApp.full_name}</strong>.
                </DialogDescription>
              </DialogHeader>

              {approvalSuccessDetails ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Account Activated & Ready
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        {approvalSuccessDetails.role}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Member Name:
                        </span>
                        <p className="font-semibold text-slate-900">{approvalSuccessDetails.fullName}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Login Email / User ID:
                        </span>
                        <p className="font-mono font-bold text-slate-900 select-all">
                          {approvalSuccessDetails.email}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Assigned Password:
                        </span>
                        <p className="font-mono font-bold text-slate-900 select-all">
                          {approvalSuccessDetails.password}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Login URL:
                        </span>
                        <Link
                          to="/login"
                          target="_blank"
                          className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          /login <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setApprovalModalApp(null)}
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
                          <span>Copy Credentials</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmApproval} className="space-y-4 pt-2 text-xs">
                  {/* Applicant Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{approvalModalApp.full_name}</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">{approvalModalApp.interest}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">{approvalModalApp.email}</p>
                    <p className="text-[11px] text-slate-600">{approvalModalApp.department} · {approvalModalApp.semester}</p>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Set Login Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setApprovalPassword(generateMemberPassword())}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Generate Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        value={approvalPassword}
                        onChange={(e) => setApprovalPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="pl-9 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assign Chapter Role *
                    </label>
                    <select
                      value={approvalRole}
                      onChange={(e) => setApprovalRole(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                    >
                      <option value="member">Member (Regular student community member)</option>
                      <option value="editor">Editor / ExeCom (Can create events, projects & announcements)</option>
                      <option value="admin">Admin (Full administrative privileges)</option>
                    </select>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Internal Admin Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add onboarding notes, membership batch, or comments..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setApprovalModalApp(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isApproving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isApproving ? "Activating..." : "Approve & Issue Key"}</span>
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ADD / EDIT ACTIVE MEMBER MODAL */}
        {/* ------------------------------------------------------------------ */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingMember ? "Edit Member Profile" : "Add Community Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Manage student profile, academic batch, and membership status.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Arun V"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College / Personal Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="student@perumonec.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID / Roll No
                  </label>
                  <Input
                    placeholder="e.g. PRP22CS014"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Membership Status
                  </label>
                  <select
                    value={formData.membership_status}
                    onChange={(e) =>
                      setFormData({ ...formData, membership_status: e.target.value as MembershipStatus })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="active">Active Member</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  GitHub Profile URL
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/username"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {saving ? "Saving..." : editingMember ? "Save Profile" : "Create Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------------ */}
        {/* VIEW MEMBER DETAILS MODAL */}
        {/* ------------------------------------------------------------------ */}
        {viewingMember && (
          <Dialog open={Boolean(viewingMember)} onOpenChange={() => setViewingMember(null)}>
            <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Member Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Avatar className="w-12 h-12 border border-slate-200">
                    <AvatarImage src={viewingMember.avatar_url || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                      {viewingMember.full_name ? viewingMember.full_name.charAt(0) : "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{viewingMember.full_name}</h4>
                    <p className="text-slate-500 font-mono">{viewingMember.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {viewingMember.membership_status || "active"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                    <p className="font-semibold text-slate-900">{viewingMember.department || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Semester</span>
                    <p className="font-semibold text-slate-900">{viewingMember.semester || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Student ID</span>
                    <p className="font-mono font-semibold text-slate-900">{viewingMember.student_id || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Joined On</span>
                    <p className="font-semibold text-slate-900">
                      {new Date(viewingMember.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {viewingMember.github_url && (
                  <div className="pt-2">
                    <a
                      href={viewingMember.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 font-semibold"
                    >
                      <Github className="w-4 h-4" />
                      <span>{viewingMember.github_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setViewingMember(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* DELETE CONFIRM DIALOG */}
        {/* ------------------------------------------------------------------ */}
        {deleteConfirmId && (
          <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent className="max-w-sm p-6 bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete Member Profile?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  This will remove the member from the directory. This action cannot be undone.
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
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMembers;
