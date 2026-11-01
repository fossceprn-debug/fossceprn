import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const AdminLogin: React.FC = () => {
  const { user, isViewer, login } = useAuth();
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in with admin privileges, redirect to /admin
  useEffect(() => {
    if (user && isViewer) {
      navigate("/admin", { replace: true });
    }
  }, [user, isViewer, navigate]);

  const handleAutofill = () => {
    setEmailOrId("fossceprn@gmail.com");
    setPassword("foss@123");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await login(emailOrId, password);
      if (res.success) {
        setSuccessMsg("Authenticated successfully. Redirecting to admin console...");
        const target = location.state?.from?.pathname || "/admin";
        setTimeout(() => navigate(target), 800);
      } else {
        setErrorMsg(res.error || "Invalid credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
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
      <div className="container mx-auto px-4 max-w-md my-8">
        <Card className="p-8 border border-slate-200/80 bg-white shadow-sm rounded-2xl">
          <CardContent className="p-0 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Admin Console Login
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sign in with your Administrator credentials to access the FOSS CEPrn admin console.
              </p>
            </div>

            {/* Quick Credentials Autofill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Administrator Sign-In:
              </span>
              <button
                type="button"
                onClick={handleAutofill}
                className="w-full p-2.5 text-left rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Super Admin
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">fossceprn@gmail.com</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                  Autofill
                </Badge>
              </button>
            </div>

            {/* Error Message */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email / User ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    type="text"
                    autoComplete="username"
                    placeholder="fossceprn@gmail.com"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {loading ? "Authenticating..." : "Sign In to Admin Panel"}
              </Button>
            </form>
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

export default AdminLogin;