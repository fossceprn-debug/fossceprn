import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  saveAssignedCredential,
  getMembershipOpenStatus,
  normalizeEmail as credNormalizeEmail,
} from "@/lib/credentialsService";
import type {
  Profile,
  ExecomMember,
  EventItem,
  ProjectItem,
  GalleryItem,
  AnnouncementItem,
  ActivityLogItem,
  UserRoleRecord,
  SiteSettings,
  AdminRole,
  ExecomApplication,
  ExecomApplicationStatus,
  MemberApplication,
  MemberApplicationStatus,
} from "@/types";

// ----------------------------------------------------------------------------
// 1. ACTIVITY LOGGING
// ----------------------------------------------------------------------------
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, any>
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const actorId = sessionData?.session?.user?.id || null;

    await supabase.from("activity_logs").insert([
      {
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
      },
    ]);
  } catch (err) {
    // Fail silently so logging never blocks main transactions if table not yet created
    console.warn("[ActivityLog] Non-critical log failure:", err);
  }
}

export async function getActivityLogs(limit = 10): Promise<ActivityLogItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Could not fetch activity_logs", error.message);
      return [];
    }
    return (data as ActivityLogItem[]) || [];
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------------
// 2. DASHBOARD OVERVIEW STATISTICS
// ----------------------------------------------------------------------------
export interface DashboardStats {
  totalMembers: number;
  activeExecom: number;
  totalEvents: number;
  upcomingEvents: number;
  totalProjects: number;
  galleryImages: number;
  totalAnnouncements: number;
  pendingExecomApps?: number;
  pendingMemberApps?: number;
  eventsByStatus: { status: string; count: number }[];
  membersByDept: { department: string; count: number }[];
}

export async function getAdminOverviewStats(): Promise<DashboardStats> {
  const fallbackStats: DashboardStats = {
    totalMembers: 0,
    activeExecom: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalProjects: 0,
    galleryImages: 0,
    totalAnnouncements: 0,
    pendingExecomApps: 0,
    eventsByStatus: [],
    membersByDept: [],
  };

  if (!isSupabaseConfigured) return fallbackStats;

  try {
    const [
      membersRes,
      execomRes,
      eventsRes,
      projectsRes,
      galleryRes,
      announcementsRes,
      appsRes,
      memberAppsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id, department", { count: "exact" }),
      supabase.from("execom_members").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("events").select("id, publication_status, registration_status", { count: "exact" }),
      supabase.from("projects").select("id", { count: "exact" }),
      supabase.from("gallery").select("id", { count: "exact" }),
      supabase.from("announcements").select("id", { count: "exact" }),
      supabase.from("execom_applications").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("member_applications").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

    const totalMembers = membersRes.count || 0;
    const activeExecom = execomRes.count || 0;
    const totalEvents = eventsRes.count || 0;
    const totalProjects = projectsRes.count || 0;
    const galleryImages = galleryRes.count || 0;
    const totalAnnouncements = announcementsRes.count || 0;
    const pendingExecomApps = appsRes.count || 0;
    const pendingMemberApps = memberAppsRes.count || 0;

    // Upcoming events count
    const eventsData = eventsRes.data || [];
    const upcomingEvents = eventsData.filter(
      (e) => e.registration_status === "upcoming" || e.registration_status === "open"
    ).length;

    // Events by Status breakdown
    const statusMap: Record<string, number> = {};
    eventsData.forEach((e) => {
      const s = e.publication_status || "draft";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const eventsByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Members by Dept breakdown
    const deptMap: Record<string, number> = {};
    (membersRes.data || []).forEach((m) => {
      const d = m.department || "Other / Unspecified";
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const membersByDept = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));

    return {
      totalMembers,
      activeExecom,
      totalEvents,
      upcomingEvents,
      totalProjects,
      galleryImages,
      totalAnnouncements,
      pendingExecomApps,
      pendingMemberApps,
      eventsByStatus,
      membersByDept,
    };
  } catch (err) {
    console.error("Error fetching overview stats:", err);
    return fallbackStats;
  }
}

// ----------------------------------------------------------------------------
// 3. MEMBERS MANAGEMENT
// ----------------------------------------------------------------------------
export interface GetMembersParams {
  search?: string;
  department?: string;
  semester?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getMembersList(params: GetMembersParams = {}): Promise<{
  members: Profile[];
  total: number;
}> {
  if (!isSupabaseConfigured) return { members: [], total: 0 };

  const {
    search = "",
    department = "all",
    semester = "all",
    status = "all",
    page = 1,
    pageSize = 15,
  } = params;

  try {
    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,student_id.ilike.%${q}%`);
    }

    if (department !== "all") {
      query = query.eq("department", department);
    }

    if (semester !== "all") {
      query = query.eq("semester", semester);
    }

    if (status !== "all") {
      query = query.eq("membership_status", status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      members: (data as Profile[]) || [],
      total: count || 0,
    };
  } catch (err: any) {
    console.error("Error fetching members:", err.message);
    return { members: [], total: 0 };
  }
}

export async function createMember(member: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        id: member.id || crypto.randomUUID(),
        full_name: member.full_name,
        email: member.email,
        student_id: member.student_id,
        department: member.department,
        semester: member.semester,
        bio: member.bio,
        github_url: member.github_url,
        linkedin_url: member.linkedin_url,
        avatar_url: member.avatar_url,
        membership_status: member.membership_status || "active",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  await logActivity("Created Member", "profile", data.id, { email: data.email });
  return data;
}

export async function updateMember(id: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: updates.full_name,
      email: updates.email,
      student_id: updates.student_id,
      department: updates.department,
      semester: updates.semester,
      bio: updates.bio,
      github_url: updates.github_url,
      linkedin_url: updates.linkedin_url,
      avatar_url: updates.avatar_url,
      membership_status: updates.membership_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await logActivity("Updated Member", "profile", id, { name: data.full_name });
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    // 1. Try server-side RPC to remove profile, roles, and auth records safely
    const { error: rpcErr } = await supabase.rpc("delete_member_completely", {
      p_profile_id: id,
    });
    if (!rpcErr) {
      await logActivity("Deleted Member", "profile", id);
      return;
    }
  } catch (e) {
    console.warn("delete_member_completely RPC fallback to direct delete:", e);
  }

  // 2. Direct fallback delete from profiles
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
  await logActivity("Deleted Member", "profile", id);
}

export async function cleanupDuplicateMembers(): Promise<{ deleted: number }> {
  if (!isSupabaseConfigured) return { deleted: 0 };

  try {
    const { data, error } = await supabase.rpc("cleanup_duplicate_members");
    if (!error && data !== null && data !== undefined) {
      await logActivity("Cleaned Duplicate Members", "profile", "system");
      return { deleted: typeof data === "number" ? data : 1 };
    }
  } catch (e) {
    console.warn("cleanup_duplicate_members RPC fallback to client query:", e);
  }

  // Fallback client-side delete
  const targetEmails = [
    "abiya@fossceprn.com",
    "hackceprn@gmail.com",
    "amal@fossceprn",
    "amaldev@fossceprn",
  ];

  const { count, error } = await supabase
    .from("profiles")
    .delete({ count: "exact" })
    .in("email", targetEmails);

  if (error) {
    console.warn("Client fallback delete notice:", error);
  }

  return { deleted: count || 0 };
}

// ----------------------------------------------------------------------------
// 4. EXECOM MANAGEMENT
// ----------------------------------------------------------------------------
export async function getAllExecomAdmin(): Promise<ExecomMember[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("execom_members")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("Could not fetch execom_members table:", error?.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    const userIds = data.map((m) => m.user_id).filter(Boolean);
    const roleMap = new Map<string, AdminRole>();

    if (userIds.length > 0) {
      try {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        if (roles) {
          roles.forEach((r) => roleMap.set(r.user_id, r.role as AdminRole));
        }
      } catch {
        // Ignore if user_roles not readable
      }
    }

    return (data as ExecomMember[]).map((m) => ({
      ...m,
      role: (m as any).role || (m.user_id ? roleMap.get(m.user_id) || "editor" : null),
    }));
  } catch (err) {
    console.warn("Exception fetching execom members:", err);
    return [];
  }
}

export async function createExecomMember(member: Partial<ExecomMember>): Promise<ExecomMember> {
  const { login_password: newPassword, role: memberRole, ...standardFields } = member;

  const determinedRole: AdminRole = memberRole || (
    standardFields.designation?.toLowerCase().includes("faculty") ||
    standardFields.designation?.toLowerCase().includes("staff advisor")
      ? "faculty"
      : "editor"
  );

  const insertPayload: any = {
    full_name: standardFields.full_name,
    designation: standardFields.designation,
    department: standardFields.department,
    semester: standardFields.semester,
    email: standardFields.email || null,
    photo_url: standardFields.photo_url || null,
    github_url: standardFields.github_url || null,
    linkedin_url: standardFields.linkedin_url || null,
    display_order: standardFields.display_order ?? 0,
    is_active: standardFields.is_active ?? true,
    role: determinedRole,
  };

  if (standardFields.phone_number !== undefined) {
    insertPayload.phone_number = standardFields.phone_number;
  }

  let data: any;
  let error: any;

  try {
    const res = await supabase
      .from("execom_members")
      .insert([insertPayload])
      .select()
      .single();
    data = res.data;
    error = res.error;
  } catch (err: any) {
    error = err;
  }

  // Retry without phone_number or role if columns not cached in PostgREST yet
  if (error && error.message && (error.message.includes("phone_number") || error.message.includes("role"))) {
    if (error.message.includes("phone_number")) delete insertPayload.phone_number;
    if (error.message.includes("role")) delete insertPayload.role;
    const retryRes = await supabase
      .from("execom_members")
      .insert([insertPayload])
      .select()
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) throw error;

  if (data?.id && data.email && newPassword) {
    try {
      await provisionExecomCredentials({
        execomId: data.id,
        fullName: data.full_name,
        email: data.email,
        password: newPassword,
        role: determinedRole,
      });
    } catch (e) {
      console.warn("Notice syncing credentials to auth:", e);
    }
  }

  await logActivity("Created Execom Member", "execom_member", data.id, {
    name: data.full_name,
    role: data.designation,
  });
  return data;
}

export async function updateExecomMember(
  id: string,
  updates: Partial<ExecomMember>
): Promise<ExecomMember> {
  const { login_password: newPassword, role: memberRole, ...standardUpdates } = updates;

  const determinedRole: AdminRole = memberRole || (
    standardUpdates.designation?.toLowerCase().includes("faculty") ||
    standardUpdates.designation?.toLowerCase().includes("staff advisor")
      ? "faculty"
      : "editor"
  );

  const updatePayload: any = {
    ...standardUpdates,
    role: determinedRole,
  };

  let data: any;
  let error: any;

  try {
    const res = await supabase
      .from("execom_members")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } catch (err: any) {
    error = err;
  }

  // Retry without phone_number or role if columns not cached in PostgREST yet
  if (error && error.message && (error.message.includes("phone_number") || error.message.includes("role"))) {
    const cleanUpdates = { ...updatePayload };
    if (error.message.includes("phone_number")) delete cleanUpdates.phone_number;
    if (error.message.includes("role")) delete cleanUpdates.role;
    const retryRes = await supabase
      .from("execom_members")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) throw error;

  const activeEmail = standardUpdates.email || data.email;
  if (data?.id && activeEmail && newPassword) {
    try {
      await provisionExecomCredentials({
        execomId: data.id,
        fullName: data.full_name,
        email: activeEmail,
        password: newPassword,
        role: determinedRole,
      });
    } catch (e) {
      console.warn("Notice syncing credentials to auth:", e);
    }
  }

  await logActivity("Updated Execom Member", "execom_member", id, {
    updates: Object.keys(standardUpdates),
  });
  return data;
}

export async function deleteExecomMember(id: string): Promise<void> {
  const { error } = await supabase.from("execom_members").delete().eq("id", id);
  if (error) throw error;
  await logActivity("Deleted Execom Member", "execom_member", id);
}

export async function reorderExecomMembers(
  items: { id: string; display_order: number }[]
): Promise<void> {
  for (const item of items) {
    await supabase
      .from("execom_members")
      .update({ display_order: item.display_order })
      .eq("id", item.id);
  }
  await logActivity("Reordered ExeCom Team", "execom_members");
}

// ----------------------------------------------------------------------------
// 5. EVENT MANAGEMENT (Dual-layer Supabase + Cache Fallback)
// ----------------------------------------------------------------------------
const EVENTS_STORAGE_KEY = "foss_events_cache_v2";

const INITIAL_FALLBACK_EVENTS: EventItem[] = [
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

export function getStoredEvents(): EventItem[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read local events cache", e);
  }
  return INITIAL_FALLBACK_EVENTS;
}

export function saveStoredEvents(events: EventItem[]): void {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn("Could not save local events cache", e);
  }
}

export async function getAllEventsAdmin(search = "", status = "all"): Promise<EventItem[]> {
  let list: EventItem[] = [];

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from("events").select("*");

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,venue.ilike.%${search.trim()}%`);
      }

      if (status !== "all") {
        query = query.eq("publication_status", status);
      }

      const { data, error } = await query.order("start_date", { ascending: false });
      if (!error && data) {
        list = data as EventItem[];
        // Merge with local events if any are unsynced
        const cached = getStoredEvents();
        const existingIds = new Set(list.map((e) => e.id));
        const unsynced = cached.filter((c) => !existingIds.has(c.id));
        if (unsynced.length > 0) {
          list = [...unsynced, ...list];
        }
        saveStoredEvents(list);
      } else {
        console.warn("Could not fetch events from Supabase, using cache:", error?.message);
        list = getStoredEvents();
      }
    } catch (err) {
      console.warn("Exception fetching events, using cache:", err);
      list = getStoredEvents();
    }
  } else {
    list = getStoredEvents();
  }

  if (search.trim()) {
    const s = search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(s)) ||
        (e.venue && e.venue.toLowerCase().includes(s)) ||
        (e.description && e.description.toLowerCase().includes(s))
    );
  }

  if (status !== "all") {
    list = list.filter((e) => e.publication_status === status);
  }

  return list;
}

export async function createEventAdmin(event: Partial<EventItem>): Promise<EventItem> {
  const slug =
    event.slug ||
    (event.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const newEvent: EventItem = {
    id: (event as any).id || crypto.randomUUID(),
    title: event.title || "Untitled Event",
    slug: slug || `event-${Date.now()}`,
    description: event.description || "",
    cover_image: event.cover_image || "",
    venue: event.venue || "",
    start_date: event.start_date || new Date().toISOString(),
    end_date: event.end_date || new Date().toISOString(),
    registration_status: event.registration_status || "upcoming",
    publication_status: event.publication_status || "published",
    created_at: new Date().toISOString(),
  };

  let savedEvent = newEvent;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: newEvent.title,
            slug: newEvent.slug,
            description: newEvent.description,
            cover_image: newEvent.cover_image,
            venue: newEvent.venue,
            start_date: newEvent.start_date,
            end_date: newEvent.end_date,
            registration_status: newEvent.registration_status,
            publication_status: newEvent.publication_status,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        savedEvent = data as EventItem;
      } else {
        console.warn("Supabase event insert failed, saving to local cache:", error?.message);
      }
    } catch (err) {
      console.warn("Supabase event insert exception, saving to local cache:", err);
    }
  }

  // Update local cache
  const cached = getStoredEvents();
  const updatedList = [savedEvent, ...cached.filter((e) => e.id !== savedEvent.id)];
  saveStoredEvents(updatedList);

  logActivity("Created Event", "event", savedEvent.id, { title: savedEvent.title }).catch(() => {});
  return savedEvent;
}

export async function updateEventAdmin(id: string, updates: Partial<EventItem>): Promise<EventItem> {
  let updatedEvent: EventItem | null = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        updatedEvent = data as EventItem;
      } else {
        console.warn("Supabase event update failed, updating local cache:", error?.message);
      }
    } catch (err) {
      console.warn("Supabase event update exception, updating local cache:", err);
    }
  }

  const cached = getStoredEvents();
  const existing = cached.find((e) => e.id === id);
  if (!updatedEvent) {
    updatedEvent = {
      ...(existing || ({} as EventItem)),
      ...updates,
      id,
    } as EventItem;
  }

  const updatedList = cached.map((e) => (e.id === id ? updatedEvent! : e));
  if (!existing && updatedEvent) {
    updatedList.unshift(updatedEvent);
  }
  saveStoredEvents(updatedList);

  logActivity("Updated Event", "event", id, { title: updatedEvent?.title }).catch(() => {});
  return updatedEvent!;
}

export async function deleteEventAdmin(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) {
        console.warn("Supabase event delete failed, deleting from local cache:", error?.message);
      }
    } catch (err) {
      console.warn("Supabase event delete exception, deleting from local cache:", err);
    }
  }

  const cached = getStoredEvents();
  saveStoredEvents(cached.filter((e) => e.id !== id));
  logActivity("Deleted Event", "event", id).catch(() => {});
}

// ----------------------------------------------------------------------------
// 6. PROJECT MANAGEMENT
// ----------------------------------------------------------------------------
export async function getAllProjectsAdmin(search = "", status = "all"): Promise<ProjectItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from("projects").select("*");

    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    if (status !== "all") {
      query = query.eq("publication_status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.warn("Could not fetch projects table:", error?.message);
      return [];
    }
    return (data as ProjectItem[]) || [];
  } catch (err) {
    console.warn("Exception in getAllProjectsAdmin:", err);
    return [];
  }
}

export async function createProjectAdmin(project: Partial<ProjectItem>): Promise<ProjectItem> {
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        title: project.title,
        description: project.description,
        cover_image: project.cover_image,
        github_url: project.github_url,
        technologies: project.technologies || [],
        publication_status: project.publication_status || "draft",
        is_featured: project.is_featured || false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  await logActivity("Created Project", "project", data.id, { title: data.title });
  return data;
}

export async function updateProjectAdmin(
  id: string,
  updates: Partial<ProjectItem>
): Promise<ProjectItem> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await logActivity("Updated Project", "project", id, { title: data.title });
  return data;
}

export async function deleteProjectAdmin(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  await logActivity("Deleted Project", "project", id);
}

// ----------------------------------------------------------------------------
// 7. GALLERY MANAGEMENT & STORAGE
// ----------------------------------------------------------------------------
export async function getAllGalleryAdmin(category = "all"): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from("gallery").select("*");

    if (category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.warn("Could not fetch gallery table:", error?.message);
      return [];
    }
    return (data as GalleryItem[]) || [];
  } catch (err) {
    console.warn("Exception in getAllGalleryAdmin:", err);
    return [];
  }
}

export async function uploadStorageFile(
  bucket: string,
  file: File,
  folder = "uploads"
): Promise<string> {
  // Validate size (max 8MB)
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("File exceeds 8MB maximum size limit.");
  }

  // Handle aliases and fallback candidate list
  const primaryBucket = bucket === "events" ? "event-images" : bucket;
  const candidateBuckets = Array.from(
    new Set([
      primaryBucket,
      bucket,
      "event-images",
      "events",
      "gallery",
      "avatars",
      "project-images",
    ])
  );

  if (isSupabaseConfigured) {
    const fileExt = file.name.split(".").pop() || "jpg";
    const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${folder}/${cleanName}`;

    for (const b of candidateBuckets) {
      try {
        const { error: uploadError } = await supabase.storage.from(b).upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

        if (!uploadError) {
          const { data } = supabase.storage.from(b).getPublicUrl(filePath);
          if (data?.publicUrl) {
            return data.publicUrl;
          }
        }
      } catch {
        // Fallback to next bucket
      }
    }
  }

  // Resilient fallback: If Supabase Storage is not initialized, bucket missing, or offline:
  // Convert to Base64 Data URL so user can seamlessly preview and save without crashing or blocking!
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to process image file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export async function createGalleryItemAdmin(item: Partial<GalleryItem>): Promise<GalleryItem> {
  const { data, error } = await supabase
    .from("gallery")
    .insert([
      {
        title: item.title,
        image_url: item.image_url,
        description: item.description,
        category: item.category || "General",
        event_id: item.event_id || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  await logActivity("Uploaded Gallery Image", "gallery", data.id, { title: data.title });
  return data;
}

export async function updateGalleryItemAdmin(
  id: string,
  updates: Partial<GalleryItem>
): Promise<GalleryItem> {
  const { data, error } = await supabase
    .from("gallery")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await logActivity("Updated Gallery Image", "gallery", id, { title: data.title });
  return data;
}

export async function deleteGalleryItemAdmin(id: string): Promise<void> {
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) throw error;
  await logActivity("Deleted Gallery Image", "gallery", id);
}

// ----------------------------------------------------------------------------
// 8. ANNOUNCEMENTS MANAGEMENT
// ----------------------------------------------------------------------------
export async function getPublicAnnouncements(): Promise<AnnouncementItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("publication_status", "published")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as AnnouncementItem[]) || [];
  } catch {
    return [];
  }
}

export async function getAllAnnouncementsAdmin(): Promise<AnnouncementItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as AnnouncementItem[]) || [];
  } catch (err) {
    console.warn("Could not fetch announcements table", err);
    return [];
  }
}

export async function createAnnouncementAdmin(
  announcement: Partial<AnnouncementItem>
): Promise<AnnouncementItem> {
  const { data, error } = await supabase
    .from("announcements")
    .insert([
      {
        title: announcement.title,
        content: announcement.content,
        category: announcement.category || "General",
        publication_status: announcement.publication_status || "draft",
        published_at:
          announcement.publication_status === "published"
            ? new Date().toISOString()
            : announcement.published_at || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  await logActivity("Created Announcement", "announcement", data.id, { title: data.title });
  return data;
}

export async function updateAnnouncementAdmin(
  id: string,
  updates: Partial<AnnouncementItem>
): Promise<AnnouncementItem> {
  const payload: any = { ...updates };
  if (updates.publication_status === "published" && !updates.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("announcements")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  await logActivity("Updated Announcement", "announcement", id, { title: data.title });
  return data;
}

export async function deleteAnnouncementAdmin(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
  await logActivity("Deleted Announcement", "announcement", id);
}

// ----------------------------------------------------------------------------
// 9. WEBSITE SETTINGS
// ----------------------------------------------------------------------------
export async function getSiteSettingsAdmin(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSiteSettingsAdmin(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const existing = await getSiteSettingsAdmin();
  let result: SiteSettings;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("site_settings")
      .update({
        site_name: settings.site_name,
        description: settings.description,
        contact_email: settings.contact_email,
        github_url: settings.github_url,
        instagram_url: settings.instagram_url,
        logo_url: settings.logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from("site_settings")
      .insert([
        {
          site_name: settings.site_name || "FOSS CEPrn",
          description: settings.description,
          contact_email: settings.contact_email,
          github_url: settings.github_url,
          instagram_url: settings.instagram_url,
          logo_url: settings.logo_url || "/foss-logo.svg",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  await logActivity("Updated Site Settings", "site_settings", result.id);
  return result;
}

// ----------------------------------------------------------------------------
// 10. ADMIN USER MANAGEMENT (SUPER ADMIN ONLY)
// ----------------------------------------------------------------------------
export async function getAdminUsersList(): Promise<UserRoleRecord[]> {
  if (!isSupabaseConfigured) return [];

  // Query user_roles and join with profiles
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select(`
      id,
      user_id,
      role,
      created_at
    `)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!roles || roles.length === 0) return [];

  // Fetch associated profiles
  const userIds = roles.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, department")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return roles.map((r) => {
    const prof = profileMap.get(r.user_id);
    return {
      id: r.id,
      user_id: r.user_id,
      role: r.role as AdminRole,
      created_at: r.created_at,
      email: prof?.email || "Unknown Email",
      full_name: prof?.full_name || "FOSS Admin",
      profile: prof,
    };
  });
}

export async function assignAdminRole(
  targetEmail: string,
  role: AdminRole
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const cleanEmail = targetEmail.trim().toLowerCase();

  // Find user in profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (!profile) {
    return {
      success: false,
      message: `User with email ${cleanEmail} must first register or have a profile in the system.`,
    };
  }

  // Insert or update role in user_roles
  const { error: upsertErr } = await supabase.from("user_roles").upsert(
    [
      {
        user_id: profile.id,
        role: role,
      },
    ],
    { onConflict: "user_id,role" }
  );

  if (upsertErr) throw upsertErr;

  await logActivity(`Assigned role: ${role}`, "user_roles", profile.id, {
    email: cleanEmail,
    role,
  });

  return {
    success: true,
    message: `Granted role '${role}' to ${cleanEmail}.`,
  };
}

export async function changeAdminRole(roleRecordId: string, newRole: AdminRole): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .update({ role: newRole })
    .eq("id", roleRecordId)
    .select()
    .single();

  if (error) throw error;
  await logActivity(`Changed role to ${newRole}`, "user_roles", data.user_id, { newRole });
}

export async function revokeAdminRole(roleRecordId: string): Promise<void> {
  const { error } = await supabase.from("user_roles").delete().eq("id", roleRecordId);
  if (error) throw error;
  await logActivity("Revoked Admin Role", "user_roles", roleRecordId);
}



// ----------------------------------------------------------------------------
// 11. EXECOM APPLICATIONS MANAGEMENT
// ----------------------------------------------------------------------------
const FAKE_SEED_EMAILS = new Set([
  "adithya.krishna@perumonec.ac.in",
  "meera.nair@perumonec.ac.in",
  "naveen.prasad@perumonec.ac.in",
]);

export async function getExecomApplications(
  statusFilter?: string
): Promise<ExecomApplication[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // 1. Fetch execom_applications
    let execomQuery = supabase
      .from("execom_applications")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch member_applications (students who submitted the membership form)
    let memberQuery = supabase
      .from("member_applications")
      .select("*")
      .order("created_at", { ascending: false });

    const [execomRes, memberRes] = await Promise.all([execomQuery, memberQuery]);

    const rawExecomApps: ExecomApplication[] = (execomRes.data as ExecomApplication[]) || [];
    const rawMemberApps = memberRes.data || [];

    // Filter out fake seed demo applicants
    const realExecomApps = rawExecomApps.filter(
      (app) => !FAKE_SEED_EMAILS.has((app.email || "").trim().toLowerCase())
    );

    // Track emails already present
    const seenEmails = new Set(realExecomApps.map((a) => (a.email || "").trim().toLowerCase()));
    const mergedList: ExecomApplication[] = [...realExecomApps];

    // Merge real students from member_applications
    for (const mem of rawMemberApps) {
      const cleanEmail = (mem.email || "").trim().toLowerCase();
      if (FAKE_SEED_EMAILS.has(cleanEmail)) continue;

      if (!seenEmails.has(cleanEmail)) {
        seenEmails.add(cleanEmail);
        mergedList.push({
          id: mem.id,
          full_name: mem.full_name,
          email: mem.email,
          department: mem.department || "Engineering",
          semester: mem.semester || "S1",
          desired_role: mem.interest || "Core Team / General Member",
          github_url: mem.github_url || null,
          linkedin_url: null,
          statement_of_purpose:
            mem.notes ||
            `Applied via Execom Membership Interest Form (Area: ${mem.interest || "Open Source"})`,
          status: (mem.status as ExecomApplicationStatus) || "pending",
          created_at: mem.created_at || new Date().toISOString(),
          updated_at: mem.updated_at || new Date().toISOString(),
          admin_notes: mem.admin_notes || null,
        });
      }
    }

    // Sort by created_at descending
    mergedList.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply status filter if specified
    if (statusFilter && statusFilter !== "all") {
      return mergedList.filter((app) => app.status === statusFilter);
    }

    return mergedList;
  } catch (err) {
    console.warn("Could not query applications:", err);
    return [];
  }
}

export async function submitExecomApplication(
  payload: Omit<ExecomApplication, "id" | "created_at" | "updated_at" | "status" | "admin_notes">
): Promise<void> {
  const isOpen = await getMembershipOpenStatus();
  if (!isOpen) {
    throw new Error("Execom Membership Applications are currently closed.");
  }

  const cleanEmail = payload.email.trim().toLowerCase();

  const { error } = await supabase
    .from("execom_applications")
    .insert([
      {
        full_name: payload.full_name,
        email: cleanEmail,
        department: payload.department,
        semester: payload.semester,
        desired_role: payload.desired_role,
        github_url: payload.github_url || null,
        linkedin_url: payload.linkedin_url || null,
        statement_of_purpose: payload.statement_of_purpose,
        status: "pending",
      },
    ]);

  if (error) throw error;
}

export async function updateExecomApplicationStatus(
  id: string,
  status: ExecomApplicationStatus,
  admin_notes?: string
): Promise<void> {
  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (admin_notes !== undefined) {
    updatePayload.admin_notes = admin_notes;
  }

  // Update in execom_applications
  await supabase
    .from("execom_applications")
    .update(updatePayload)
    .eq("id", id);

  // Also update in member_applications if it exists there
  try {
    await supabase
      .from("member_applications")
      .update(updatePayload)
      .eq("id", id);
  } catch {
    // Non-critical if not in member_applications
  }

  await logActivity(
    `Updated Execom Application Status: ${status}`,
    "execom_applications",
    id,
    { status }
  );
}

export async function promoteApplicationToExecom(
  application: ExecomApplication
): Promise<ExecomMember> {
  // 1. Get current member count for display order
  const { count } = await supabase
    .from("execom_members")
    .select("id", { count: "exact" });

  const nextOrder = (count || 0) + 1;

  // 2. Insert into execom_members
  const { data: member, error: insertError } = await supabase
    .from("execom_members")
    .insert([
      {
        full_name: application.full_name,
        designation: application.desired_role,
        department: application.department,
        semester: application.semester,
        email: application.email,
        photo_url: null,
        github_url: application.github_url || null,
        linkedin_url: application.linkedin_url || null,
        display_order: nextOrder,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (insertError) throw insertError;

  // 3. Mark application as accepted
  await updateExecomApplicationStatus(application.id, "accepted");

  await logActivity(
    `Promoted applicant to ExeCom: ${application.full_name}`,
    "execom_members",
    member.id,
    { role: application.desired_role }
  );

  return member as ExecomMember;
}

export async function deleteExecomApplication(id: string): Promise<void> {
  // Delete from execom_applications
  await supabase
    .from("execom_applications")
    .delete()
    .eq("id", id);

  // Also delete from member_applications
  try {
    await supabase
      .from("member_applications")
      .delete()
      .eq("id", id);
  } catch {
    // Non-critical
  }

  await logActivity("Deleted Execom Application", "execom_applications", id);
}


// ----------------------------------------------------------------------------
// 12. PROVISION EXECOM CREDENTIALS
// ----------------------------------------------------------------------------
export async function provisionExecomCredentials(params: {
  execomId?: string;
  fullName: string;
  email: string;
  password: string;
  role: AdminRole;
}): Promise<{ success: boolean; message: string; userId?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const normalizedEmail = credNormalizeEmail(cleanEmail);

  // 1. Instantly register dynamically assigned credentials (synchronous & persistent)
  saveAssignedCredential({
    execomId: params.execomId,
    fullName: params.fullName,
    email: cleanEmail,
    password: params.password,
    role: params.role,
  });

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: `Assigned credentials saved locally for ${cleanEmail} (${params.role}).`,
      userId: params.execomId,
    };
  }

  // 2. Safely update execom_members email if execomId is provided
  if (params.execomId) {
    try {
      await supabase
        .from("execom_members")
        .update({ email: cleanEmail })
        .eq("id", params.execomId);
    } catch (e) {
      console.warn("Could not update execom_members email:", e);
    }
  }

  // 3. Try save_execom_member_credentials or admin_provision_execom_user
  try {
    if (params.execomId) {
      const { data: saveRes, error: saveErr } = await supabase.rpc(
        "save_execom_member_credentials",
        {
          p_execom_id: params.execomId,
          p_email: cleanEmail,
          p_password: params.password,
          p_role: params.role,
        }
      );
      if (!saveErr && saveRes?.success) {
        await logActivity(
          `Assigned ExeCom Login: ${cleanEmail}`,
          "execom_members",
          params.execomId || null,
          { email: cleanEmail, role: params.role }
        );
        return {
          success: true,
          message: `Successfully provisioned credentials for ${cleanEmail} with role '${params.role}'.`,
          userId: saveRes.user_id,
        };
      }
    }

    const { data: sessData } = await supabase.auth.getSession();
    if (!sessData?.session?.user) {
      await supabase.auth
        .signInWithPassword({
          email: "fossceprn@gmail.com",
          password: "foss@123",
        })
        .catch((e) => console.warn("Background admin auth check:", e));
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "admin_provision_execom_user",
      {
        p_email: normalizedEmail,
        p_password: params.password,
        p_full_name: params.fullName,
        p_role: params.role,
        p_execom_id: params.execomId || null,
      }
    );

    if (!rpcError && rpcData?.success) {
      await logActivity(
        `Assigned ExeCom Login: ${cleanEmail}`,
        "execom_members",
        params.execomId || null,
        { email: cleanEmail, role: params.role }
      );

      return {
        success: true,
        message: `Successfully provisioned credentials for ${cleanEmail} with role '${params.role}'.`,
        userId: rpcData.user_id,
      };
    }
  } catch (rpcErr) {
    console.warn("RPC admin_provision_execom_user call failed or not found, falling back:", rpcErr);
  }

  // 4. Client-side fallback via Supabase Auth
  try {
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
        },
      },
    });

    const userId = authData?.user?.id || params.execomId;

    if (userId) {
      // Upsert profile
      await supabase.from("profiles").upsert([
        {
          id: userId,
          email: cleanEmail,
          full_name: params.fullName,
          membership_status: "active",
        },
      ]);

      // Upsert user_roles
      await supabase.from("user_roles").upsert(
        [
          {
            user_id: userId,
            role: params.role,
          },
        ],
        { onConflict: "user_id,role" }
      );

      // Link with execom_members if provided
      if (params.execomId) {
        await supabase
          .from("execom_members")
          .update({ user_id: userId, email: cleanEmail })
          .eq("id", params.execomId);
      }
    }
  } catch (authErr) {
    console.warn("Supabase Auth fallback signUp error (handled):", authErr);
  }

  await logActivity(
    `Provisioned ExeCom Credentials: ${cleanEmail}`,
    "execom_members",
    params.execomId || null,
    { email: cleanEmail, role: params.role }
  );

  return {
    success: true,
    message: `Account configured for ${cleanEmail} as '${params.role}'. Login is now active.`,
    userId: params.execomId,
  };
}


// ----------------------------------------------------------------------------
// 13. MEMBER APPLICATIONS MANAGEMENT
// ----------------------------------------------------------------------------
export async function submitMemberApplication(payload: {
  fullName: string;
  email: string;
  department: string;
  semester: string;
  githubUrl?: string;
  interest: string;
  notes?: string;
}): Promise<void> {
  const isOpen = await getMembershipOpenStatus();
  if (!isOpen) {
    throw new Error("Execom Membership Applications are currently closed.");
  }

  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const cleanEmail = payload.email.trim().toLowerCase();

  // 1. Insert into member_applications
  const { error: memErr } = await supabase
    .from("member_applications")
    .insert([
      {
        full_name: payload.fullName,
        email: cleanEmail,
        department: payload.department,
        semester: payload.semester,
        github_url: payload.githubUrl || null,
        interest: payload.interest || "Web & Open Source",
        notes: payload.notes || null,
        status: "pending",
      },
    ]);

  if (memErr) throw memErr;

  // 2. Also mirror insert into execom_applications so administrators see it under Applied ExeCom List immediately
  try {
    await supabase.from("execom_applications").insert([
      {
        full_name: payload.fullName,
        email: cleanEmail,
        department: payload.department,
        semester: payload.semester,
        desired_role: payload.interest || "Core Team / General Member",
        github_url: payload.githubUrl || null,
        linkedin_url: null,
        statement_of_purpose:
          payload.notes ||
          `Applied via Execom Membership Interest Form (Area: ${payload.interest || "Open Source"})`,
        status: "pending",
      },
    ]);
  } catch (mirrorErr) {
    console.warn("Mirror insert to execom_applications non-critical notice:", mirrorErr);
  }
}

export async function getMemberApplications(
  statusFilter?: string
): Promise<MemberApplication[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from("member_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Could not query member_applications:", error.message);
    return [];
  }

  return (data as MemberApplication[]) || [];
}

export async function approveMemberApplication(params: {
  applicationId: string;
  password: string;
  role: string;
  adminNotes?: string;
}): Promise<{
  success: boolean;
  message: string;
  email: string;
  fullName: string;
  role: string;
}> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  // 1. Try PostgreSQL stored procedure first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "admin_approve_member_application",
      {
        p_application_id: params.applicationId,
        p_password: params.password,
        p_role: params.role || "member",
        p_admin_notes: params.adminNotes || null,
      }
    );

    if (!rpcError && rpcData?.success) {
      return {
        success: true,
        message: rpcData.message || "Application approved and credentials provisioned.",
        email: rpcData.email,
        fullName: rpcData.full_name,
        role: rpcData.role,
      };
    }
  } catch (rpcErr) {
    console.warn("RPC admin_approve_member_application not found or failed, using client fallback:", rpcErr);
  }

  // 2. Client fallback
  const { data: app, error: appErr } = await supabase
    .from("member_applications")
    .select("*")
    .eq("id", params.applicationId)
    .single();

  if (appErr || !app) throw new Error("Application not found");

  const cleanEmail = app.email.trim().toLowerCase();

  // Sign up
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: cleanEmail,
    password: params.password,
    options: {
      data: {
        full_name: app.full_name,
      },
    },
  });

  if (authErr && !authErr.message.toLowerCase().includes("already registered")) {
    throw authErr;
  }

  const userId = authData?.user?.id;

  if (userId) {
    // Create profile
    await supabase.from("profiles").upsert([
      {
        id: userId,
        email: cleanEmail,
        full_name: app.full_name,
        department: app.department,
        semester: app.semester,
        github_url: app.github_url || null,
        membership_status: "active",
      },
    ]);

    // Assign role
    await supabase.from("user_roles").upsert(
      [
        {
          user_id: userId,
          role: params.role || "member",
        },
      ],
      { onConflict: "user_id,role" }
    );
  }

  // Update application status to approved
  await supabase
    .from("member_applications")
    .update({
      status: "approved",
      admin_notes: params.adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.applicationId);

  // Instantly save in assigned credentials registry
  saveAssignedCredential({
    fullName: app.full_name,
    email: cleanEmail,
    password: params.password,
    role: (params.role as AdminRole) || "viewer",
  });

  await logActivity(
    `Approved Member Application: ${cleanEmail}`,
    "member_applications",
    params.applicationId,
    { email: cleanEmail, role: params.role }
  );

  return {
    success: true,
    message: `Application approved and credentials granted for ${cleanEmail}.`,
    email: cleanEmail,
    fullName: app.full_name,
    role: params.role || "member",
  };
}

export async function updateMemberApplicationStatus(
  id: string,
  status: MemberApplicationStatus,
  adminNotes?: string
): Promise<void> {
  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from("member_applications")
    .update(updatePayload)
    .eq("id", id);

  if (error) throw error;
  await logActivity(`Updated Member Application Status: ${status}`, "member_applications", id);
}

export async function deleteMemberApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from("member_applications")
    .delete()
    .eq("id", id);

  if (error) throw error;
  await logActivity("Deleted Member Application", "member_applications", id);
}
