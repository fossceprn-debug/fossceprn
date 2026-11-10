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

export const INITIAL_SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-001",
    title: "FOSS CEPrn ExeCom & Faculty Monthly Review",
    description:
      "Monthly strategic alignment meeting between student executive coordinators and department faculty advisors to review ongoing activities, platform updates, and upcoming hackathon milestones.",
    activity_date: formatDateOffset(0), // Today
    deadline_date: formatDateOffset(0),
    start_time: "03:30 PM",
    end_time: "04:30 PM",
    venue: "Department Conference Room / Google Meet",
    category: "Meeting",
    status: "published",
    coordinators: ["Amal Dev A", "Arun V"],
    volunteers: [
      { name: "Abiya Daniel", task: "Minutes of Meeting & Agenda Circulation" },
      { name: "Amal Dev A", task: "Presentation Slides & Screen Sharing" },
    ],
    created_by: "Administrator",
    created_at: new Date().toISOString(),
  },
  {
    id: "act-002",
    title: "Hands-on Git & GitHub for Open Source Contribution",
    description:
      "Interactive technical workshop covering Git fundamentals, branching, resolving merge conflicts, creating clean pull requests, and making your first open source contribution.",
    activity_date: formatDateOffset(3),
    deadline_date: formatDateOffset(2),
    start_time: "10:00 AM",
    end_time: "01:00 PM",
    venue: "Computer Lab 2, CSE Block",
    category: "Workshop",
    status: "published",
    coordinators: ["Arun V", "Amal Dev A"],
    volunteers: [
      { name: "Abiya Daniel", task: "Registration Desk & Attendee Check-in" },
      { name: "Arun V", task: "Lab Systems Setup & Git Verification" },
      { name: "Amal Dev A", task: "Hands-on PR Review & Mentor Support" },
    ],
    created_by: "FOSS CEPrn Technical Team",
    created_at: new Date().toISOString(),
  },
  {
    id: "act-003",
    title: "Open Source Hack Night & PR Review Sprint",
    description:
      "Community peer-coding session dedicated to resolving open issues on college FOSS projects, testing new modules, and reviewing pull requests together.",
    activity_date: formatDateOffset(7),
    deadline_date: formatDateOffset(5),
    start_time: "04:30 PM",
    end_time: "06:30 PM",
    venue: "Seminar Hall 1",
    category: "Coding Session",
    status: "published",
    coordinators: ["Amal Dev A", "Abiya Daniel"],
    volunteers: [
      { name: "Arun V", task: "Wi-Fi & Network Provisioning" },
      { name: "Abiya Daniel", task: "Issue Board & Task Allocation" },
      { name: "Amal Dev A", task: "Code Review & Mentorship" },
    ],
    created_by: "Amal Dev A",
    created_at: new Date().toISOString(),
  },
  {
    id: "act-004",
    title: "Technical Talk: Systems Programming with Rust",
    description:
      "Deep dive into the Rust programming language, ownership model, borrow checker, concurrency safety, and building high-performance CLI tools.",
    activity_date: formatDateOffset(14),
    deadline_date: formatDateOffset(12),
    start_time: "02:00 PM",
    end_time: "04:00 PM",
    venue: "Main College Auditorium",
    category: "Technical Talk",
    status: "published",
    coordinators: ["Arun V", "Amal Dev A"],
    volunteers: [
      { name: "Abiya Daniel", task: "Guest Speaker Hospitality & Stage Management" },
      { name: "Arun V", task: "Projector, Audio & Live Q&A Mic Support" },
    ],
    created_by: "Arun V (Tech Lead)",
    created_at: new Date().toISOString(),
  },
  {
    id: "act-005",
    title: "CEPrn Campus Winter Hackathon 2026",
    description:
      "Flagship 24-hour campus hackathon fostering open-source solutions for campus automation, sustainability, and student tools. Mentorship and food provided.",
    activity_date: formatDateOffset(24),
    deadline_date: formatDateOffset(20),
    start_time: "09:00 AM",
    end_time: "05:00 PM",
    venue: "Central Computing Facility (CCF)",
    category: "Hackathon",
    status: "published",
    coordinators: ["Amal Dev A", "Arun V"],
    volunteers: [
      { name: "Abiya Daniel", task: "Registration & Participant ID Badges" },
      { name: "Arun V", task: "Mentor Coordination & Evaluation Desk" },
      { name: "Amal Dev A", task: "Server Infrastructure & Repo Setup" },
    ],
    created_by: "FOSS CEPrn ExeCom",
    created_at: new Date().toISOString(),
  },
];

function getStoredActivities(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read local activities storage", e);
  }
  // Initialize with seed
  saveStoredActivities(INITIAL_SEED_ACTIVITIES);
  return INITIAL_SEED_ACTIVITIES;
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

export async function getUpcomingActivities(limit: number = 5): Promise<ActivityItem[]> {
  const todayStr = formatDateOffset(0);
  const all = await getAllActivities();
  const upcoming = all
    .filter((a) => a.activity_date >= todayStr && a.status === "published")
    .sort((a, b) => {
      const cmp = a.activity_date.localeCompare(b.activity_date);
      if (cmp !== 0) return cmp;
      return a.start_time.localeCompare(b.start_time);
    });

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

