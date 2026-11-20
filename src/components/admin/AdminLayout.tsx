import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CalendarDays,
  FolderGit2,
  Image,
  Megaphone,
  Settings,
  ShieldCheck,
  Database,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user, role, isAdmin, isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavDropdownOpen, setMobileNavDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Activity Calendar", href: "/admin/calendar", icon: CalendarDays },
    { name: "Faculty Console", href: "/faculty/dashboard", icon: GraduationCap },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "ExeCom", href: "/admin/execom", icon: UserCheck },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Projects", href: "/admin/projects", icon: FolderGit2 },
    { name: "Gallery", href: "/admin/gallery", icon: Image },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  ];

  const systemLinks = [
    { name: "Website Settings", href: "/admin/settings", icon: Settings },
    { name: "Database & Storage", href: "/admin/storage", icon: Database },
    ...(isSuperAdmin
      ? [{ name: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, superOnly: true }]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeVariant = (r: string | null) => {
    switch (r) {
      case "super_admin":
        return "default";
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-[#f8fafc] text-slate-800 flex flex-col lg:flex-row antialiased w-full max-w-full overflow-hidden">
      {/* DESKTOP SIDEBAR (Static - Fixed in place) */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col justify-between bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 z-30 select-none">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
                  FOSS CEPrn
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mt-0.5">
                  Admin Console
                </span>
              </div>
            </Link>

            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              v2.0
            </span>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
            {/* Highlighted Green Button to ExeCom Main Dashboard */}
            {(isAdmin || isSuperAdmin) && (
              <div className="px-1">
                <a
                  href="https://foss.ieprn.co.in/execom/dashboard"
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all group"
                  title="Access ExeCom Chapter Main Dashboard"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <LayoutDashboard className="w-4 h-4 text-emerald-100" />
                    </div>
                    <div className="flex flex-col text-left leading-tight min-w-0">
                      <span className="text-xs font-extrabold text-white truncate">Main Dashboard</span>
                      <span className="text-[10px] text-emerald-100/90 font-semibold truncate">ExeCom & QR Operations</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </a>
              </div>
            )}

            {/* Primary Section */}
            <div className="space-y-1">
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Management
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* System Section */}
            <div className="space-y-1">
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </div>
              {systemLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`}
                      />
                      <span>{link.name}</span>
                    </div>
                    {link.superOnly && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        SUPER
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Account Bar at Bottom */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(user?.full_name || user?.email || "A").substring(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {user?.full_name || "Admin"}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {user?.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white h-full flex flex-col justify-between shadow-2xl p-4 z-10 animate-slide-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    F
                  </div>
                  <span className="font-extrabold text-sm text-slate-900">FOSS CEPrn</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {/* Highlighted Green Button for Admins & Super Admins */}
                {(isAdmin || isSuperAdmin) && (
                  <div className="mb-3">
                    <a
                      href="https://foss.ieprn.co.in/execom/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold text-xs"
                      title="Access ExeCom Chapter Main Dashboard"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-emerald-200" />
                        <span>ExeCom Main Dashboard</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                    </a>
                  </div>
                )}
                {[...navLinks, ...systemLinks].map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        active
                          ? "bg-emerald-50 text-emerald-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-center gap-2 text-xs text-rose-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen h-[100dvh] w-full max-w-full overflow-hidden">
        {/* Top Navbar (Static - Pinned to top) */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 w-full max-w-full select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Title Badge */}
            <div className="sm:hidden flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{title}</span>
            </div>

            {/* Breadcrumb / Title (Tablet & Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
              <Link to="/admin" className="hover:text-emerald-600 transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{title}</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Highlighted Green Button for Admins & Super Admins to access ExeCom Main Dashboard */}
            {(isAdmin || isSuperAdmin) && (
              <Button
                asChild
                size="sm"
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3"
              >
                <a
                  href="https://foss.ieprn.co.in/execom/dashboard"
                  className="flex items-center gap-1 sm:gap-1.5"
                  title="Access ExeCom Chapter Main Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span className="hidden sm:inline">ExeCom Main Dashboard</span>
                  <span className="sm:hidden text-[11px]">Dashboard</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200 opacity-80 shrink-0 hidden xs:inline" />
                </a>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold border-slate-200 gap-1 px-2 sm:px-3"
            >
              <Link to="/" target="_blank" rel="noreferrer">
                <span className="hidden sm:inline">View Public Site</span>
                <span className="sm:hidden text-[11px]">Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            </Button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{role?.replace("_", " ") || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page Content Body (Scrolls independently while sidebar & top header stay static) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <main className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
            </div>

            {/* Children Content */}
            {children}
          </main>
        </div>

        {/* ================================================================== */}
        {/* MOBILE FLOATING ROUND MENU (Only in mobile phones, not desktop) */}
        {/* ================================================================== */}
        <div className="lg:hidden">
          {/* Backdrop overlay */}
          {mobileNavDropdownOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-fade-in"
              onClick={() => setMobileNavDropdownOpen(false)}
            />
          )}

          {/* Floating Dock Menu Container */}
          {mobileNavDropdownOpen && (
            <div className="fixed bottom-24 right-5 z-50 w-72 max-h-[75vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl p-3.5 space-y-2 animate-scale-in">
              <div className="px-2.5 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  ADMIN NAVIGATION
                </span>
                <button
                  onClick={() => setMobileNavDropdownOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Dashboard Link */}
              {(isAdmin || isSuperAdmin) && (
                <a
                  href="https://foss.ieprn.co.in/execom/dashboard"
                  onClick={() => setMobileNavDropdownOpen(false)}
                  className="flex items-center justify-between p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-emerald-100" />
                    <span>ExeCom Main Dashboard</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {[...navLinks, ...systemLinks].map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileNavDropdownOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        active
                          ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60"
                          : "text-slate-700 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                        <span>{link.name}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2 text-xs">
                <Link
                  to="/"
                  target="_blank"
                  className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Site</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-rose-600 font-bold hover:text-rose-700 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Circular Floating Action Button (FAB) */}
          <button
            type="button"
            onClick={() => setMobileNavDropdownOpen(!mobileNavDropdownOpen)}
            aria-label="Toggle Admin Navigation Menu"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xl flex items-center justify-center transition-all duration-200 border-2 border-white/30 cursor-pointer focus:outline-none"
          >
            {mobileNavDropdownOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

