import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/lib/authContext";

export const Login: React.FC = () => {
  const { user, login, logout, isAdmin, isSuperAdmin, isEditor, isViewer } = useAuth();
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isPrivileged = Boolean(user && (isAdmin || isSuperAdmin || isEditor || isViewer));

  // Quick Autofill for Super Admin
  const handleFillAdmin = () => {
    setEmailOrId("fossceprn@gmail.com");
    setPassword("foss@123");
    setErrorMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await login(emailOrId, password);
      if (res.success) {
        const isExecomUser = res.role === "editor";
        const target = location.state?.from?.pathname || (isExecomUser ? "/execom/dashboard" : "/admin");
        setSuccessMsg(
          isExecomUser
            ? "Signed in successfully! Opening ExeCom Dashboard..."
            : "Signed in successfully! Opening Admin Console..."
        );
        setTimeout(() => {
          navigate(target);
        }, 600);
      } else {
        setErrorMsg(res.error || "Invalid user ID or password. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isEditor) return "ExeCom Coordinator";
    return "Member";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top navigation bar */}
      <div className="p-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <BrandLogo showSubtext={false} />
      </div>

      {/* Center Unified Auth Card */}
      <div className="container mx-auto px-4 max-w-md my-6">
        <Card className="p-7 sm:p-8 border border-slate-200/90 bg-white rounded-3xl shadow-xl shadow-slate-200/50">
          <CardContent className="p-0 space-y-6">
            {/* Header Lockup - Unified Login */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Enter your Email or User ID to access the FOSS CEPrn dashboard.
              </p>
            </div>

            {/* If Already Logged In */}
            {user ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    You are Signed In
                  </h3>
                  <p className="text-xs font-mono text-slate-600">
                    {user.email}
                  </p>
                  <div className="pt-1">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                      {getRoleBadgeLabel()}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {isPrivileged && (
                    <Button asChild size="default" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 font-bold">
                      <Link to={isAdmin ? "/admin" : "/execom/dashboard"}>
                        <LayoutDashboard className="w-4 h-4" />
                        <span>{isAdmin ? "Open Admin Console" : "Open ExeCom Dashboard"}</span>
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="default" className="w-full">
                    <Link to="/">Return to Home</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className="w-full gap-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Error / Success Feedback */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Unified Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email / User ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        required
                        type="text"
                        autoComplete="username"
                        placeholder="fossceprn@gmail.com or User ID"
                        value={emailOrId}
                        onChange={(e) => setEmailOrId(e.target.value)}
                        className="pl-10 h-10 text-xs bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        required
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-10 text-xs bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm shadow-emerald-600/20"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                {/* Administrator Sign-In Helper */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Administrator Access
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> One-click login
                    </span>
                  </div>

                  {/* Super Admin */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Administrator</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-300 text-slate-700 bg-slate-50">
                          SUPER ADMIN
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFillAdmin}
                        className="h-6 px-2 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                      >
                        Autofill
                      </Button>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                      <div>User ID: <span className="font-semibold text-slate-800">fossceprn@gmail.com</span></div>
                      <div>Password: <span className="font-semibold text-slate-800">foss@123</span></div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  ExeCom Member Portal is also accessible at{" "}
                  <Link to="/execom/login" className="text-emerald-700 font-semibold hover:underline">
                    /execom/login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-xs text-slate-400">
        FOSS UNITED Students Chapter · College of Engineering Perumon
      </div>
    </div>
  );
};

export default Login;