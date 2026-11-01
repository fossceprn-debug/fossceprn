import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/types";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isViewer, isSuperAdmin, isAdmin, isEditor, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying administrator session...</p>
      </div>
    );
  }

  // If not logged in at all, redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is ExeCom coordinator (editor), redirect them away from Admin Panel to ExeCom Dashboard
  if (!isAdmin && isEditor) {
    return <Navigate to="/execom/dashboard" replace />;
  }

  // If logged in as regular member with no admin permissions
  if (!isViewer || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your account (<strong className="text-slate-800">{user.email}</strong>) does not have
            administrator privileges. Only chapter administrators can access this console.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button asChild size="sm">
              <Link to="/login">Sign In with Admin Account</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If specific role required (e.g. super_admin for admin users management)
  if (requiredRole === "super_admin" && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Super Admin Required</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            This module requires <strong>Super Administrator</strong> permissions. Your current role
            is <strong>{user.role}</strong>.
          </p>
          <div className="pt-2">
            <Button asChild size="sm">
              <Link to="/admin">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

