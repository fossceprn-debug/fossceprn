import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/authContext";

// Public Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Events from "@/pages/Events";
import EventDetails from "@/pages/EventDetails";
import Projects from "@/pages/Projects";
import Execom from "@/pages/Execom";
import Gallery from "@/pages/Gallery";
import Join from "@/pages/Join";
import Login from "@/pages/Login";
import ExecomLogin from "@/pages/ExecomLogin";
import ExecomDashboard from "@/pages/execom/ExecomDashboard";
import { ExecomProtectedRoute } from "@/components/execom/ExecomProtectedRoute";
import NotFound from "@/pages/NotFound";

// Admin Pages & Protected Route Gate
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminMembers from "@/pages/admin/AdminMembers";
import AdminExecom from "@/pages/admin/AdminExecom";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminGallery from "@/pages/admin/AdminGallery";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUsers from "@/pages/admin/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/execom" element={<Execom />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/join" element={<Join />} />
            <Route path="/login" element={<Login />} />

            {/* Admin & ExeCom Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/execom/login" element={<ExecomLogin />} />

            {/* Dedicated ExeCom Coordinator Dashboard */}
            <Route
              path="/execom/dashboard"
              element={
                <ExecomProtectedRoute>
                  <ExecomDashboard />
                </ExecomProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminOverview />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <AdminProtectedRoute>
                  <AdminMembers />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/execom"
              element={
                <AdminProtectedRoute>
                  <AdminExecom />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminProtectedRoute>
                  <AdminEvents />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <AdminProtectedRoute>
                  <AdminProjects />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/gallery"
              element={
                <AdminProtectedRoute>
                  <AdminGallery />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <AdminProtectedRoute>
                  <AdminAnnouncements />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminProtectedRoute>
                  <AdminSettings />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/admin-users"
              element={
                <AdminProtectedRoute requiredRole="super_admin">
                  <AdminUsers />
                </AdminProtectedRoute>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
