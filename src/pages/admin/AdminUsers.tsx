import React, { useEffect, useState } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  getAdminUsersList,
  assignAdminRole,
  changeAdminRole,
  revokeAdminRole,
} from "@/lib/adminService";
import { useAuth } from "@/lib/authContext";
import type { UserRoleRecord, AdminRole } from "@/types";

const ROLE_DEFINITIONS: Record<
  AdminRole,
  { label: string; description: string; badgeClass: string }
> = {
  super_admin: {
    label: "Super Admin",
    description: "Unrestricted access: manage administrators, roles, website settings, and all modules.",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  admin: {
    label: "Admin",
    description: "Full content control: manage members, ExeCom, events, projects, gallery, and announcements.",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  editor: {
    label: "Editor",
    description: "Operational editing: create and modify events, projects, and announcements. Cannot change roles or settings.",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access: review analytics, member registrations, and submissions.",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();

  const [adminUsers, setAdminUsers] = useState<UserRoleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // New admin role form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revoke confirmation modal
  const [recordToRevoke, setRecordToRevoke] = useState<UserRoleRecord | null>(
    null
  );
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  async function loadAdminUsers() {
    setIsLoading(true);
    try {
      const data = await getAdminUsersList();
      setAdminUsers(data);
    } catch (err: any) {
      console.error("Failed to load admin users:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to load privileged admin users list.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await assignAdminRole(newEmail, newRole);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        setShowAssignModal(false);
        setNewEmail("");
        setNewRole("admin");
        await loadAdminUsers();
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } catch (err: any) {
      console.error("Assign error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to assign administrative role.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(recordId: string, updatedRole: AdminRole) {
    try {
      await changeAdminRole(recordId, updatedRole);
      setFeedback({
        type: "success",
        message: `Admin role successfully updated to ${updatedRole}.`,
      });
      await loadAdminUsers();
    } catch (err: any) {
      console.error("Change role error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to update role.",
      });
    }
  }

  async function handleConfirmRevoke() {
    if (!recordToRevoke) return;

    if (
      recordToRevoke.email === "fossceprn@gmail.com" ||
      recordToRevoke.user_id === user?.id
    ) {
      alert("You cannot revoke your own account or the primary root administrator.");
      setRecordToRevoke(null);
      return;
    }

    try {
      setIsRevoking(true);
      await revokeAdminRole(recordToRevoke.id);
      setFeedback({
        type: "success",
        message: `Revoked access for ${recordToRevoke.email}.`,
      });
      setRecordToRevoke(null);
      await loadAdminUsers();
    } catch (err: any) {
      console.error("Revoke error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to revoke administrative role.",
      });
    } finally {
      setIsRevoking(false);
    }
  }

  const filteredUsers = adminUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout
      title="Admin Users & Role Control"
      subtitle="Super Administrator console for managing elevated privileges, staff roles, and audit access."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminUsers}
            disabled={isLoading}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="h-9 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Role</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-6xl">
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
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Security Architecture Callout */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white text-sm">
                Server-Enforced Row Level Security (RLS)
              </p>
              <p className="text-slate-400">
                Administrative permissions are verified in PostgreSQL via <code className="text-emerald-400">public.user_roles</code>. Frontend state is purely visual—all database mutations strictly reject non-privileged JWTs.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 shrink-0">
            Root Account: <span className="text-emerald-300 font-mono">fossceprn@gmail.com</span>
          </div>
        </div>

        {/* Role Breakdown Reference Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((rKey) => {
            const info = ROLE_DEFINITIONS[rKey];
            return (
              <div
                key={rKey}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${info.badgeClass}`}>
                    {info.label}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 leading-relaxed">
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Search & Summary */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by email, name, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total Privileged Users: <strong className="text-slate-800">{adminUsers.length}</strong>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading admin user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No admin users found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? "Try searching with a different term." : "Use 'Assign Role' above to grant access."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Assigned On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((item) => {
                    const isRoot = item.email === "fossceprn@gmail.com";
                    const isCurrentUser = item.user_id === user?.id;
                    const roleDef = ROLE_DEFINITIONS[item.role] || ROLE_DEFINITIONS.viewer;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                              {item.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {item.full_name || item.email}
                                </span>
                                {isRoot && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                                    Default Root
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px]">{item.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isSuperAdmin && !isRoot ? (
                            <select
                              value={item.role}
                              onChange={(e) =>
                                handleRoleChange(item.id, e.target.value as AdminRole)
                              }
                              className="text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md font-semibold border ${roleDef.badgeClass}`}
                            >
                              {roleDef.label}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "System Genesis"}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isSuperAdmin && !isRoot && !isCurrentUser ? (
                            <button
                              type="button"
                              onClick={() => setRecordToRevoke(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Revoke Admin Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Role Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Assign Administrative Role</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                The user must already have registered an account or profile on FOSS CEPrn. Once granted, their next session will have elevated dashboard permissions.
              </p>

              <form onSubmit={handleAssign} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    User Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. core-member@ceprn.ac.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role Privilege Level *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  >
                    <option value="admin">Admin (Full content operations)</option>
                    <option value="editor">Editor (Create & update content)</option>
                    <option value="viewer">Viewer (Read-only analytics)</option>
                    <option value="super_admin">Super Admin (Unrestricted security & staff access)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {ROLE_DEFINITIONS[newRole]?.description}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmitting ? "Assigning..." : "Confirm & Grant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {recordToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revoke Administrative Access?</h3>
                  <p className="text-xs text-slate-500">This action takes effect immediately.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to revoke the role <strong className="text-slate-900 font-semibold">{recordToRevoke.role}</strong> from <strong className="text-slate-900 font-mono">{recordToRevoke.email}</strong>? They will immediately lose access to the administrative dashboard.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToRevoke(null)}
                  disabled={isRevoking}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={isRevoking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isRevoking ? "Revoking..." : "Revoke Privileges"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
