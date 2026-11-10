import { createClient } from "@supabase/supabase-js";
import type { EventItem, ProjectItem, ExecomMember, GalleryItem, SiteSettings } from "@/types";

const DEFAULT_SUPABASE_URL = "https://fngwxkuihlkfsiskicue.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_lwF0J4SQl7-aO0_PiGF9tg_4kG4dI6N";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 20
);

if (!isSupabaseConfigured) {
  console.info(
    "[FOSS CEPrn] Supabase credentials not configured in environment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to your live database."
  );
}

// Fallback dummy URL and anon key to prevent createClient constructor crash when unconfigured
const clientUrl: string =
  isSupabaseConfigured && supabaseUrl ? supabaseUrl : "https://placeholder-project.supabase.co";
const clientKey: string =
  isSupabaseConfigured && supabaseAnonKey ? supabaseAnonKey : "placeholder-anon-key";

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database Fetchers with safe fallback
export async function getPublishedEvents(): Promise<EventItem[]> {
  let list: EventItem[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("publication_status", "published")
        .order("start_date", { ascending: true });

      if (!error && data) {
        list = data as EventItem[];
      } else {
        console.warn("[Supabase] Error fetching events:", error?.message);
      }
    } catch (err) {
      console.warn("[Supabase] Unexpected error fetching events:", err);
    }
  }

  // Also include locally cached published events
  try {
    const raw = localStorage.getItem("foss_events_cache_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const published = parsed.filter((e) => e.publication_status === "published");
        const existingIds = new Set(list.map((e) => e.id));
        for (const pe of published) {
          if (!existingIds.has(pe.id)) {
            list.push(pe);
          }
        }
      }
    }
  } catch {}

  // Fallback defaults if table is empty or offline
  if (list.length === 0) {
    list = [
      {
        id: "e1000000-0000-0000-0000-000000000001",
        title: "Linux & Git Mastery Workshop",
        slug: "linux-git-mastery-workshop",
        description: "Hands-on masterclass covering terminal mastery, shell scripting, Git branching strategies, and upstream contributions.",
        cover_image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80",
        venue: "ASAP Lab / CSE Seminar Hall",
        start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(),
        registration_status: "open",
        publication_status: "published",
        created_at: new Date().toISOString(),
      },
      {
        id: "e1000000-0000-0000-0000-000000000002",
        title: "FOSS Hackathon 2026 - Perumon",
        slug: "foss-hackathon-2026",
        description: "24-hour campus hackathon building real-world open-source tooling, libraries, and web apps for social good.",
        cover_image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
        venue: "Central Computing Facility & ASAP Lab",
        start_date: new Date(Date.now() + 86400000 * 9).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 10).toISOString(),
        registration_status: "open",
        publication_status: "published",
        created_at: new Date().toISOString(),
      },
    ];
  }

  return list;
}

export async function getEventBySlugOrId(slugOrId: string): Promise<EventItem | null> {
  if (!slugOrId) {
    return null;
  }
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      let query = supabase.from("events").select("*");
      if (isUuid) {
        query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
      } else {
        query = query.eq("slug", slugOrId);
      }
      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        return (data as EventItem) || null;
      }
    } catch (err) {
      console.warn("[Supabase] Unexpected error fetching event:", err);
    }
  }

  // Check cached events
  try {
    const raw = localStorage.getItem("foss_events_cache_v2");
    if (raw) {
      const parsed: EventItem[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = parsed.find((e) => e.id === slugOrId || e.slug === slugOrId);
        if (found) return found;
      }
    }
  } catch {}

  // Check fallback seed
  if (slugOrId === "linux-git-mastery-workshop" || slugOrId === "e1000000-0000-0000-0000-000000000001") {
    return {
      id: "e1000000-0000-0000-0000-000000000001",
      title: "Linux & Git Mastery Workshop",
      slug: "linux-git-mastery-workshop",
      description: "Hands-on masterclass covering terminal mastery, shell scripting, Git branching strategies, and upstream contributions.",
      cover_image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80",
      venue: "ASAP Lab / CSE Seminar Hall",
      start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      end_date: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(),
      registration_status: "open",
      publication_status: "published",
      created_at: new Date().toISOString(),
    };
  }

  return null;
}

export async function getPublishedProjects(): Promise<ProjectItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("publication_status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase] Error fetching projects:", error.message);
      return [];
    }
    return (data as ProjectItem[]) || [];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching projects:", err);
    return [];
  }
}

export async function getActiveExecom(): Promise<ExecomMember[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("execom_members")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[Supabase] Error fetching execom:", error.message);
      return [];
    }
    return (data as ExecomMember[]) || [];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching execom:", err);
    return [];
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase] Error fetching gallery:", error.message);
      return [];
    }
    return (data as GalleryItem[]) || [];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching gallery:", err);
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Error fetching site settings:", error.message);
      return null;
    }
    return data as SiteSettings | null;
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching site settings:", err);
    return null;
  }
}
