import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AnnouncementItem } from "@/types";

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("foss_dismissed_announcements");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function fetchAnnouncements() {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          // If table doesn't exist yet, simply don't show
          return;
        }

        if (data) {
          // Filter by start and expiry dates
          const valid = (data as AnnouncementItem[]).filter((item) => {
            if (item.starts_at && new Date(item.starts_at) > new Date(now)) {
              return false;
            }
            if (item.expires_at && new Date(item.expires_at) < new Date(now)) {
              return false;
            }
            return true;
          });
          setAnnouncements(valid);
        }
      } catch (err) {
        // Non-critical, ignore
      }
    }

    fetchAnnouncements();
  }, []);

  function handleDismiss(id: string) {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem("foss_dismissed_announcements", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  // Show top priority announcement
  const activeItem = visibleAnnouncements[0];

  const typeConfig: Record<
    string,
    { bg: string; border: string; text: string; icon: React.ReactNode; accent: string }
  > = {
    info: {
      bg: "bg-blue-50/95",
      border: "border-blue-200",
      text: "text-blue-900",
      accent: "text-blue-600",
      icon: <Bell className="w-4 h-4 text-blue-600 shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50/95",
      border: "border-amber-200",
      text: "text-amber-900",
      accent: "text-amber-600",
      icon: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
    },
    success: {
      bg: "bg-emerald-50/95",
      border: "border-emerald-200",
      text: "text-emerald-900",
      accent: "text-emerald-600",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    },
    event: {
      bg: "bg-purple-50/95",
      border: "border-purple-200",
      text: "text-purple-900",
      accent: "text-purple-600",
      icon: <Calendar className="w-4 h-4 text-purple-600 shrink-0" />,
    },
  };

  const style = typeConfig[activeItem.type || "info"] || typeConfig.info;
  const isExternal = activeItem.link_url?.startsWith("http");

  return (
    <div
      className={`w-full border-b ${style.border} ${style.bg} backdrop-blur-sm transition-all duration-300 relative z-30`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1 rounded-md bg-white/80 shadow-xs shrink-0">
              {style.icon}
            </span>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
              <span className={`font-bold ${style.text} tracking-tight`}>
                {activeItem.title}:
              </span>
              <span className="text-slate-700 truncate max-w-xl">
                {activeItem.content}
              </span>
            </div>

            {activeItem.link_url && (
              isExternal ? (
                <a
                  href={activeItem.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 font-semibold text-xs ${style.accent} hover:underline shrink-0 ml-1`}
                >
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  to={activeItem.link_url}
                  className={`inline-flex items-center gap-1 font-semibold text-xs ${style.accent} hover:underline shrink-0 ml-1`}
                >
                  View details <ArrowRight className="w-3 h-3" />
                </Link>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => handleDismiss(activeItem.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-black/5 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

