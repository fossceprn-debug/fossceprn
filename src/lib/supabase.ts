import { createClient } from "@supabase/supabase-js";
import type { EventItem, ProjectItem, ExecomMember, GalleryItem, SiteSettings } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("publication_status", "published")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[Supabase] Error fetching events:", error.message);
      return [];
    }
    return (data as EventItem[]) || [];
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching events:", err);
    return [];
  }
}

export async function getEventBySlugOrId(slugOrId: string): Promise<EventItem | null> {
  if (!isSupabaseConfigured || !slugOrId) {
    return null;
  }
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    let query = supabase.from("events").select("*");
    if (isUuid) {
      query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
    } else {
      query = query.eq("slug", slugOrId);
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[Supabase] Error fetching event:", error.message);
      return null;
    }
    return (data as EventItem) || null;
  } catch (err) {
    console.error("[Supabase] Unexpected error fetching event:", err);
    return null;
  }
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
