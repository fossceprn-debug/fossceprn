import { supabase, isSupabaseConfigured } from "./supabase";
import type { ActivityItem, ActivityCategory, ActivityStatus } from "@/types";

const ACTIVITIES_STORAGE_KEY = "foss_activities_cache_v2";

function formatDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const INITIAL_SEED_ACTIVITIES: ActivityItem[] = [];

function getStoredActivities(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge any legacy false/mock seed activities
        const realActivities = parsed.filter(
          (a) => a && !["act-001", "act-002", "act-003", "act-004", "act-005"].includes(a.id)
        );
        return realActivities;
      }
    }
  } catch (e) {
    console.warn("Could not read local activities storage", e);
  }
  return [];
}

function saveStoredActivities(activities: ActivityItem[]): void {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (e) {
    console.warn("Could not save local activities", e);
  }
}

export async function getAllActivities(filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<ActivityItem[]> {
  let list: ActivityItem[] = [];

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from("activities")
        .select("*")
        .order("activity_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.category && filters.category !== "All") {
        query = query.eq("category", filters.category);
      }
      if (filters?.status && filters.status !== "All") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as ActivityItem[];
        saveStoredActivities(list);
      } else {
        list = getStoredActivities();
      }
    } catch (err) {
      console.warn("Fallback to cached activities:", err);
      list = getStoredActivities();
    }
  } else {
    list = getStoredActivities();
  }

  // Apply filters locally if fallback was used
  if (filters?.category && filters.category !== "All") {
    list = list.filter((a) => a.category === filters.category);
  }
  if (filters?.status && filters.status !== "All") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        a.description.toLowerCase().includes(s) ||
        a.venue.toLowerCase().includes(s) ||
        a.category.toLowerCase().includes(s)
    );
  }

  return list;
}

export async function getTodayActivities(): Promise<ActivityItem[]> {
  const todayStr = formatDateOffset(0);
  const all = await getAllActivities();
  return all.filter(
    (a) => a.activity_date === todayStr && a.status === "published"
  );
}

export async function getUpcomingActivities(limit: number = 8): Promise<ActivityItem[]> {
  const todayStr = formatDateOffset(0);
  let all = await getAllActivities();
  let upcoming = all
    .filter((a) => a.activity_date >= todayStr && a.status === "published")
    .sort((a, b) => {
      const cmp = a.activity_date.localeCompare(b.activity_date);
      if (cmp !== 0) return cmp;
      return a.start_time.localeCompare(b.start_time);
    });

  // If there are no upcoming activities (e.g. past dates in DB or empty table),
  // generate and schedule fresh active upcoming activities relative to today!
  if (upcoming.length === 0) {
    const offsets = [2, 5, 8, 12, 18];
    const freshUpcoming = INITIAL_SEED_ACTIVITIES.map((act, idx) => {
      const offset = offsets[idx % offsets.length];
      return {
        ...act,
        id: `upcoming-act-${idx + 1}-${todayStr}`,
        activity_date: formatDateOffset(offset),
        deadline_date: formatDateOffset(Math.max(0, offset - 1)),
        status: "published" as const,
      };
    });
    saveStoredActivities(freshUpcoming);
    upcoming = freshUpcoming;
  }

  return upcoming.slice(0, limit);
}

export async function createActivity(
  activity: Omit<ActivityItem, "id" | "created_at" | "updated_at">
): Promise<ActivityItem> {
  const newItem: ActivityItem = {
    ...activity,
    id: "act-" + Date.now(),
    deadline_date: activity.deadline_date || null,
    coordinators: activity.coordinators || [],
    volunteers: activity.volunteers || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const insertData: any = {
        title: activity.title,
        description: activity.description,
        activity_date: activity.activity_date,
        deadline_date: activity.deadline_date || null,
        start_time: activity.start_time,
        end_time: activity.end_time || null,
        venue: activity.venue,
        category: activity.category,
        status: activity.status || "published",
        coordinators: activity.coordinators || [],
        volunteers: activity.volunteers || [],
        created_by: activity.created_by || "Admin",
      };

      let res = await supabase.from("activities").insert([insertData]).select().single();

      // If columns not yet in schema cache, fallback without them
      if (res.error && (res.error.message.includes("coordinators") || res.error.message.includes("deadline_date") || res.error.message.includes("volunteers"))) {
        delete insertData.coordinators;
        delete insertData.volunteers;
        delete insertData.deadline_date;
        res = await supabase.from("activities").insert([insertData]).select().single();
      }

      if (!res.error && res.data) {
        const created = {
          ...res.data,
          deadline_date: activity.deadline_date || res.data.deadline_date,
          coordinators: activity.coordinators || res.data.coordinators,
          volunteers: activity.volunteers || res.data.volunteers,
        } as ActivityItem;
        const current = getStoredActivities();
        saveStoredActivities([created, ...current]);
        return created;
      }
    } catch (err) {
      console.warn("Supabase create activity error, saved to local cache:", err);
    }
  }

  // Local fallback
  const current = getStoredActivities();
  const updated = [newItem, ...current];
  saveStoredActivities(updated);
  return newItem;
}

export async function updateActivity(
  id: string,
  updates: Partial<ActivityItem>
): Promise<ActivityItem> {
  const current = getStoredActivities();
  const targetIndex = current.findIndex((a) => a.id === id);
  const existing = targetIndex >= 0 ? current[targetIndex] : null;

  const merged: ActivityItem = existing
    ? {
        ...existing,
        ...updates,
        deadline_date: updates.deadline_date !== undefined ? updates.deadline_date : existing.deadline_date,
        coordinators: updates.coordinators !== undefined ? updates.coordinators : existing.coordinators,
        volunteers: updates.volunteers !== undefined ? updates.volunteers : existing.volunteers,
        updated_at: new Date().toISOString(),
      }
    : ({
        id,
        title: updates.title || "Activity",
        description: updates.description || "",
        activity_date: updates.activity_date || formatDateOffset(0),
        deadline_date: updates.deadline_date || null,
        start_time: updates.start_time || "10:00 AM",
        end_time: updates.end_time || null,
        venue: updates.venue || "Campus",
        category: (updates.category as ActivityCategory) || "Workshop",
        status: (updates.status as ActivityStatus) || "published",
        coordinators: updates.coordinators || [],
        volunteers: updates.volunteers || [],
        created_by: updates.created_by || "Admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ActivityItem);

  if (isSupabaseConfigured) {
    try {
      const updateData: any = {
        title: merged.title,
        description: merged.description,
        activity_date: merged.activity_date,
        deadline_date: merged.deadline_date || null,
        start_time: merged.start_time,
        end_time: merged.end_time,
        venue: merged.venue,
        category: merged.category,
        status: merged.status,
        coordinators: merged.coordinators || [],
        volunteers: merged.volunteers || [],
        updated_at: new Date().toISOString(),
      };

      let res = await supabase.from("activities").update(updateData).eq("id", id).select().single();

      if (res.error && (res.error.message.includes("coordinators") || res.error.message.includes("deadline_date") || res.error.message.includes("volunteers"))) {
        delete updateData.coordinators;
        delete updateData.volunteers;
        delete updateData.deadline_date;
        res = await supabase.from("activities").update(updateData).eq("id", id).select().single();
      }

      if (!res.error && res.data) {
        const updatedItem = {
          ...res.data,
          deadline_date: merged.deadline_date,
          coordinators: merged.coordinators,
          volunteers: merged.volunteers,
        } as ActivityItem;
        if (targetIndex >= 0) {
          current[targetIndex] = updatedItem;
        } else {
          current.unshift(updatedItem);
        }
        saveStoredActivities(current);
        return updatedItem;
      }
    } catch (err) {
      console.warn("Supabase update activity error, updated in local cache:", err);
    }
  }

  if (targetIndex >= 0) {
    current[targetIndex] = merged;
  } else {
    current.unshift(merged);
  }
  saveStoredActivities(current);
  return merged;
}

export async function deleteActivity(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("activities").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete activity error:", err);
    }
  }

  const current = getStoredActivities();
  const filtered = current.filter((a) => a.id !== id);
  saveStoredActivities(filtered);
}

