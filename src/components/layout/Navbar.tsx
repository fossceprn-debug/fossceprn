import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowRight,
  UserCircle2,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";

// Clean navigation: Only Home, Events, ExeCom, Gallery
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "ExeCom", href: "/execom" },
  { name: "Gallery", href: "/gallery" },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, isViewer, isSuperAdmin, isEditor, isFaculty, role, logout } = useAuth();
  const location = useLocation();

  const isPrivilegedUser = Boolean(user && (isAdmin || isViewer || isSuperAdmin || isEditor || isFaculty));

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getDashboardLabel = () => {
    if (isSuperAdmin || isAdmin) return "Admin Dashboard";
    if (isFaculty) return "Faculty Console";
    if (isEditor) return "ExeCom Member Dashboard";
    return "Dashboard";
  };

  const getDashboardUrl = () => {
    if (isSuperAdmin || isAdmin) return "/admin";
    if (isFaculty) return "/faculty/dashboard";
    if (isEditor) return "/execom/dashboard";
    return "/login";
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isFaculty) return "Faculty";
    if (isEditor) return "ExeCom";
    if (isViewer) return "Staff";
    return "Member";
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border/80 py-3"
          : "bg-white border-b border-border/40 py-4"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "text-foss-green font-semibold bg-foss-greenLight/60"
                    : "text-foss-black hover:text-foss-green hover:bg-foss-lightBg"
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-foss-green rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Dashboard button shown for Admins and ExeCom members */}
          {isPrivilegedUser && (
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Link to={getDashboardUrl()}>
                <LayoutDashboard className="w-4 h-4" />
                <span>{getDashboardLabel()}</span>
              </Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={getDashboardUrl()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foss-lightBg border border-border hover:border-foss-green transition-colors text-xs font-semibold text-foss-black"
                title={isPrivilegedUser ? "Go to Dashboard" : "User Profile"}
              >
                {isPrivilegedUser ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <UserCircle2 className="w-4 h-4 text-foss-green" />
                )}
                <span className="max-w-[130px] truncate">{user.email}</span>
                <Badge
                  variant={isPrivilegedUser ? "default" : "secondary"}
                  className={`text-[10px] py-0 px-1.5 ${
                    isPrivilegedUser ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
                  }`}
                >
                  {getRoleLabel()}
                </Badge>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-foss-gray hover:text-rose-600 hover:bg-rose-50 p-2 h-9 w-9 rounded-lg"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-foss-black hover:text-foss-green hover:bg-foss-lightBg flex items-center gap-2 font-medium"
            >
              <Link to="/login" title="Login for Admin & ExeCom Members">
                <UserCircle2 className="w-4 h-4" />
                <span>Login</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="default"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Link to="/join">
              <span>Join Community</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile Header Right */}
        <div className="flex items-center lg:hidden gap-2">
          {isPrivilegedUser ? (
            <Link
              to={getDashboardUrl()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-full shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{getRoleLabel()}</span>
            </Link>
          ) : (
            <Link
              to="/join"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-full shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <span>Join</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-full w-9 h-9 text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MOBILE FLOATING MENU BAR (Round Icon Only in Mobile Phones) */}
      {/* ================================================================== */}
      <div className="lg:hidden">
        {/* Backdrop overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Floating Dock Menu Container */}
        {mobileMenuOpen && (
          <div className="fixed bottom-24 right-5 z-50 w-64 max-h-[75vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl p-3.5 space-y-2 animate-scale-in">
            <div className="px-2.5 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                FOSS CEPRN MENU
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Privileged Dashboard Banner */}
            {isPrivilegedUser && (
              <Link
                to={getDashboardUrl()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{getDashboardLabel()}</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-bold shrink-0">
                  {getRoleLabel()}
                </Badge>
              </Link>
            )}

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60"
                        : "text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <span>{link.name}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <Button
                asChild
                size="sm"
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-sm"
              >
                <Link to="/join" onClick={() => setMobileMenuOpen(false)}>
                  <span>Join Community</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>

              {user ? (
                <div className="pt-1 flex items-center justify-between px-1 text-[11px]">
                  <span className="text-slate-400 truncate max-w-[140px] font-mono">
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 border border-slate-200"
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  <span>Login (Admin / ExeCom)</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Circular Floating Action Button (FAB) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open Navigation Menu"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xl flex items-center justify-center transition-all duration-200 border-2 border-white/30 cursor-pointer focus:outline-none"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
