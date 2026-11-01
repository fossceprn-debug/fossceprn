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
  const { user, isAdmin, isViewer, isSuperAdmin, isEditor, role, logout } = useAuth();
  const location = useLocation();

  const isPrivilegedUser = Boolean(user && (isAdmin || isViewer || isSuperAdmin || isEditor));

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
    if (isEditor) return "ExeCom Dashboard";
    return "Dashboard";
  };

  const getDashboardUrl = () => {
    if (isSuperAdmin || isAdmin) return "/admin";
    if (isEditor) return "/execom/dashboard";
    return "/login";
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
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

        {/* Mobile Hamburger Button */}
        <div className="flex items-center lg:hidden gap-2">
          {isPrivilegedUser && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-lg"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foss-black" />
            ) : (
              <Menu className="w-6 h-6 text-foss-black" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-border shadow-lg animate-slide-down px-4 pt-3 pb-6 space-y-3">
          {/* Prominent Dashboard Action in Mobile Drawer */}
          {isPrivilegedUser && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{getRoleLabel()} Active</span>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                <Link to={getDashboardUrl()}>
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                  <span>{getDashboardLabel()}</span>
                </Link>
              </Button>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-foss-greenLight text-foss-greenDark font-semibold"
                      : "text-foss-black hover:bg-foss-lightBg"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-foss-lightBg border border-border">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foss-black">
                    <ShieldCheck className="w-4 h-4 text-foss-green" />
                    <span className="truncate max-w-[180px]">{user.email}</span>
                  </div>
                  <Badge variant={isPrivilegedUser ? "default" : "secondary"} className="text-[10px]">
                    {getRoleLabel()}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="w-full justify-center text-xs gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full justify-center"
              >
                <Link to="/login" className="flex items-center justify-center gap-2">
                  <UserCircle2 className="w-4 h-4" />
                  <span>Login (Admin & ExeCom)</span>
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="default"
              className="w-full justify-center"
            >
              <Link to="/join" className="flex items-center justify-center gap-2">
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
