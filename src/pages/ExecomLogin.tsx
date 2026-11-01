import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const ExecomLogin: React.FC = () => {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await login(emailOrId, password);
      if (res.success) {
        setSuccessMsg("Authenticated successfully! Redirecting to ExeCom dashboard...");
        const target = location.state?.from?.pathname || "/execom/dashboard";
        setTimeout(() => navigate(target), 700);
      } else {
        setErrorMsg(res.error || "Invalid coordinator credentials. Please check your user ID and password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected login error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-emerald-600/20">
            F
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">FOSS CEPrn</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-xs text-slate-500 gap-1.5">
            <Link to="/login">
              <span>Universal Login</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs text-slate-700 gap-1.5">
            <Link to="/">
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-slate-200/90 bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-2 sm:p-4">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <UserCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ExeCom Leadership Portal
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Sign in with your assigned ExeCom coordinator credentials to manage events, projects, and announcements.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Coordinator Email / User ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <Input
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="coordinator@fossceprn"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    className="pl-10 h-10 text-xs bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    required
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
                {loading ? "Authenticating..." : "Sign In to ExeCom Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="text-center pt-2 text-[11px] text-slate-400">
              Credentials are issued by the Chapter Administrator. If you need access, contact{" "}
              <a href="mailto:fossceprn@gmail.com" className="text-emerald-700 font-semibold hover:underline">
                fossceprn@gmail.com
              </a>
            </div>
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

export default ExecomLogin;