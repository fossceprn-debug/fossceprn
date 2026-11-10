import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FacultyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isFaculty, isAdmin, isSuperAdmin, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Checking faculty authorization...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has faculty, admin, or super_admin privileges
  const hasAccess = isFaculty || isAdmin || isSuperAdmin;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Faculty Access Restricted
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            Your account (<strong className="text-slate-800">{user.email}</strong>) is not
            registered with Faculty Coordinator or Staff Advisor credentials. Please contact the
            FOSS CEPrn Chapter Administrator to request faculty advisor access.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="w-full sm:w-auto text-xs"
            >
              Sign Out
            </Button>
            <Button
              asChild
              size="sm"
              className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

