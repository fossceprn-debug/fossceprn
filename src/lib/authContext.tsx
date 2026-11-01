import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  verifyAssignedCredential,
  findAssignedCredential,
  normalizeEmail as credNormalizeEmail,
} from "@/lib/credentialsService";
import type { AuthUser, AdminRole } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  role: AdminRole | "member" | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canManageUsers: boolean;
  canEditContent: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: AdminRole | "member" }>;
  logout: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const DEFAULT_ADMIN_EMAIL = "fossceprn@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "foss@123";
const AUTH_STORAGE_KEY = "foss_auth_user_session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(dbRole: string | null | undefined, email: string): AdminRole | "member" {
  if (dbRole === "super_admin") return "super_admin";
  if (dbRole === "admin" || dbRole === "lead") {
    // If it's the primary system account, elevate to super_admin
    return email === DEFAULT_ADMIN_EMAIL ? "super_admin" : "admin";
  }
  if (dbRole === "editor") return "editor";
  if (dbRole === "viewer") return "viewer";
  if (email === DEFAULT_ADMIN_EMAIL) return "super_admin";
  return "member";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleForUser = async (userId: string, email: string) => {
    if (!isSupabaseConfigured) {
      return normalizeRole(null, email);
    }
    try {
      const { data: roleRecords } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roleRecords && roleRecords.length > 0) {
        // Priority order
        const roles = roleRecords.map((r) => r.role);
        if (roles.includes("super_admin")) return "super_admin";
        if (roles.includes("admin") || roles.includes("lead")) {
          return email === DEFAULT_ADMIN_EMAIL ? "super_admin" : "admin";
        }
        if (roles.includes("editor")) return "editor";
        if (roles.includes("viewer")) return "viewer";
      }
    } catch (err) {
      console.warn("Error querying user_roles", err);
    }
    return normalizeRole(null, email);
  };

  const refreshUserRole = async () => {
    if (!user) return;
    const role = await fetchRoleForUser(user.id, user.email);
    setUser((prev) => (prev ? { ...prev, role } : null));
  };

  useEffect(() => {
    // 1. Check local storage session first
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setUser(parsed);
          // Auto-refresh Supabase Auth session for super admin so RPC/RLS operations have a valid admin JWT
          if (
            isSupabaseConfigured &&
            (parsed.email === DEFAULT_ADMIN_EMAIL || parsed.role === "super_admin")
          ) {
            supabase.auth.getSession().then(({ data }) => {
              if (!data?.session) {
                supabase.auth
                  .signInWithPassword({
                    email: DEFAULT_ADMIN_EMAIL,
                    password: DEFAULT_ADMIN_PASSWORD,
                  })
                  .catch((e) => console.warn("Admin background auth notice:", e));
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load local auth session", e);
    }

    // 2. Check live Supabase session if configured
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) {
          const authUser = data.session.user;
          const userEmail = authUser.email || "";
          const userRole = await fetchRoleForUser(authUser.id, userEmail);

          const currentUser: AuthUser = {
            id: authUser.id,
            email: userEmail,
            full_name: authUser.user_metadata?.full_name || "FOSS Member",
            role: userRole,
          };
          setUser(currentUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        }
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const authUser = session.user;
            const userEmail = authUser.email || "";
            const userRole = await fetchRoleForUser(authUser.id, userEmail);

            const currentUser: AuthUser = {
              id: authUser.id,
              email: userEmail,
              full_name: authUser.user_metadata?.full_name || "FOSS Member",
              role: userRole,
            };
            setUser(currentUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
          } else {
            const saved = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!saved) {
              setUser(null);
            }
          }
          setLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: AdminRole | "member" }> => {
    const rawInput = email.trim().toLowerCase();
    
    // Normalize custom handles like "amal@fossceprn" or "amal" into valid RFC email format for Supabase
    let normalizedEmail = credNormalizeEmail(rawInput);
    const cleanHandle = rawInput.replace(/@.*$/, "");

    // 1. Check Super Admin credentials (supports email or user ID aliases like "fossceprn", "admin")
    const isAdminAccount =
      rawInput === DEFAULT_ADMIN_EMAIL ||
      normalizedEmail === DEFAULT_ADMIN_EMAIL ||
      cleanHandle === "fossceprn" ||
      cleanHandle === "admin" ||
      cleanHandle === "superadmin";

    if (isAdminAccount) {
      if (password === DEFAULT_ADMIN_PASSWORD) {
        const defaultAdminUser: AuthUser = {
          id: "00000000-0000-0000-0000-000000000001",
          email: DEFAULT_ADMIN_EMAIL,
          full_name: "FOSS CEPrn Administrator",
          role: "super_admin",
        };

        // Perform live Supabase Auth login in background so the browser has an active JWT for all admin RPC/RLS operations
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signInWithPassword({
              email: DEFAULT_ADMIN_EMAIL,
              password: DEFAULT_ADMIN_PASSWORD,
            });
          } catch (e) {
            console.warn("Background Supabase admin auth notice:", e);
          }
        }

        setUser(defaultAdminUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdminUser));
        return { success: true, role: "super_admin" };
      } else {
        return {
          success: false,
          error: "Invalid password for administrator account.",
        };
      }
    }

    // 2. Check dynamically assigned ExeCom coordinator credentials (with immediate update support)
    const assignedCheck = verifyAssignedCredential(rawInput, password);
    if (assignedCheck.matchedUser) {
      if (assignedCheck.passwordValid && assignedCheck.credential) {
        const cred = assignedCheck.credential;
        const userRole: AdminRole = cred.role || "editor";
        const loggedUser: AuthUser = {
          id: cred.execomId || "00000000-0000-0000-0000-000000000002",
          email: cred.normalizedEmail || normalizedEmail,
          full_name: cred.fullName || "ExeCom Coordinator",
          role: userRole,
        };
        setUser(loggedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
        return { success: true, role: userRole };
      } else {
        // The user ID matches an ExeCom member, but the password provided is invalid
        return {
          success: false,
          error: "Invalid password for this coordinator account. Please verify your credentials.",
        };
      }
    }

    // 3. If Supabase is configured, attempt live authentication for other registered accounts
    if (isSupabaseConfigured) {
      try {
        let authResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (authResult.error && normalizedEmail !== rawInput) {
          try {
            const rawResult = await supabase.auth.signInWithPassword({
              email: rawInput,
              password,
            });
            if (!rawResult.error && rawResult.data.user) {
              authResult = rawResult;
            }
          } catch {}
        }

        if (!authResult.error && authResult.data?.user) {
          const userRole = await fetchRoleForUser(authResult.data.user.id, normalizedEmail);
          const loggedUser: AuthUser = {
            id: authResult.data.user.id,
            email: authResult.data.user.email || normalizedEmail,
            full_name: authResult.data.user.user_metadata?.full_name || "FOSS Member",
            role: userRole,
          };

          setUser(loggedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
          return { success: true, role: userRole };
        }

        // Check if user is an ExeCom coordinator in database
        try {
          const { data: exMember } = await supabase
            .from("execom_members")
            .select("id, full_name, email, designation")
            .or(`email.ilike.${rawInput},email.ilike.${normalizedEmail},full_name.ilike.%${cleanHandle}%`)
            .limit(1)
            .maybeSingle();

          if (exMember) {
            const assigned =
              findAssignedCredential(rawInput) ||
              findAssignedCredential(exMember.email || "") ||
              findAssignedCredential(exMember.full_name || "");
            if (assigned) {
              if (assigned.password === password) {
                const userRole: AdminRole = assigned.role || "editor";
                const loggedUser: AuthUser = {
                  id: exMember.id,
                  email: exMember.email || rawInput,
                  full_name: exMember.full_name || "ExeCom Coordinator",
                  role: userRole,
                };
                setUser(loggedUser);
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
                return { success: true, role: userRole };
              } else {
                return {
                  success: false,
                  error: "Invalid password for this coordinator account. Please verify your credentials.",
                };
              }
            }
          }
        } catch (dbErr) {
          console.warn("Notice checking execom_members table during login:", dbErr);
        }

        // Sanitize error message so raw database / GoTrue schema crashes are never exposed to users
        const rawErrMsg = authResult.error?.message || "";
        let friendlyMsg = "Invalid email / user ID or password. Please verify your credentials.";
        if (rawErrMsg) {
          const lower = rawErrMsg.toLowerCase();
          if (
            lower.includes("invalid login credentials") ||
            lower.includes("invalid credentials") ||
            lower.includes("user not found")
          ) {
            friendlyMsg = "Invalid email / user ID or password. Please verify your credentials.";
          } else if (lower.includes("email not confirmed")) {
            friendlyMsg = "Email address has not been confirmed yet. Please verify your inbox.";
          } else if (
            !lower.includes("database error") &&
            !lower.includes("schema") &&
            !lower.includes("500") &&
            !lower.includes("internal")
          ) {
            friendlyMsg = rawErrMsg;
          }
        }

        return { success: false, error: friendlyMsg };
      } catch (err: any) {
        return {
          success: false,
          error: "Invalid email / user ID or password. Please verify your credentials.",
        };
      }
    }

    return {
      success: false,
      error: "Invalid login credentials. Please check your email / user ID and password.",
    };
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error signing out from Supabase", err);
      }
    }
  };

  const currentRole = user?.role || null;
  const isSuperAdmin = currentRole === "super_admin";
  const isAdmin = currentRole === "super_admin" || currentRole === "admin";
  const isEditor = isSuperAdmin || isAdmin || currentRole === "editor";
  const isViewer = isEditor || currentRole === "viewer";
  const canManageUsers = isSuperAdmin;
  const canEditContent = isEditor;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isSuperAdmin,
        isAdmin,
        isEditor,
        isViewer,
        canManageUsers,
        canEditContent,
        loading,
        login,
        logout,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
