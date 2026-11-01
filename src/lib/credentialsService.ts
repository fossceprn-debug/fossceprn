import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AdminRole } from "@/types";

export interface AssignedCredential {
  execomId?: string;
  fullName: string;
  email: string;
  normalizedEmail: string;
  aliases?: string[];
  password: string;
  role: AdminRole;
  updatedAt: string;
}

const CREDENTIALS_KEY = "foss_assigned_credentials";
const MEMBERSHIP_STATUS_KEY = "foss_membership_open";

export function normalizeEmail(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.includes("@") && !clean.split("@")[1].includes(".")) {
    return `${clean}.com`;
  }
  if (!clean.includes("@") && clean.length > 0) {
    return `${clean}@fossceprn.com`;
  }
  return clean;
}

/**
 * Retrieve all dynamically assigned credentials from persistent storage
 */
export function getAssignedCredentials(): AssignedCredential[] {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) {
      return [];
    }
    const list: AssignedCredential[] = JSON.parse(raw);
    if (!Array.isArray(list)) {
      return [];
    }
    return list;
  } catch (err) {
    console.warn("Failed to load assigned credentials from localStorage:", err);
    return [];
  }
}

/**
 * Save or update assigned credentials for an ExeCom coordinator
 */
export function saveAssignedCredential(cred: {
  execomId?: string;
  fullName: string;
  email: string;
  password: string;
  role: AdminRole;
}): AssignedCredential {
  const list = getAssignedCredentials();
  const cleanInput = cred.email.trim().toLowerCase();
  const normalized = normalizeEmail(cleanInput);

  // Extract handle without domain
  const handle = cleanInput.includes("@")
    ? cleanInput.split("@")[0]
    : cleanInput;

  // Build aliases set
  const aliases = Array.from(
    new Set([cleanInput, normalized, handle, `${handle}@fossceprn`, `${handle}@fossceprn.com`])
  );

  const isAmalAccount =
    cred.fullName.trim().toLowerCase() === "amal" ||
    cleanInput.includes("amal") ||
    handle.includes("amal") ||
    cred.execomId === "00000000-0000-0000-0000-000000000002" ||
    cred.execomId === "f6ee6a22-7cb4-4b8e-ae84-32844dc03ee3";

  if (isAmalAccount) {
    aliases.push(
      "amal",
      "amal@fossceprn",
      "amal@fossceprn.com",
      "amaldev",
      "amaldev@fossceprn",
      "amaldev@fossceprn.com"
    );
  }

  const record: AssignedCredential = {
    execomId: cred.execomId || (isAmalAccount ? "00000000-0000-0000-0000-000000000002" : undefined),
    fullName: cred.fullName,
    email: cleanInput,
    normalizedEmail: normalized,
    aliases,
    password: cred.password,
    role: cred.role,
    updatedAt: new Date().toISOString(),
  };

  // Find existing index by execomId, name, or any alias
  const existingIndex = list.findIndex((c) => {
    if (cred.execomId && c.execomId === cred.execomId) return true;
    if (isAmalAccount && (c.fullName.toLowerCase() === "amal" || c.email.toLowerCase().includes("amal"))) return true;
    if (c.email.toLowerCase() === cleanInput || c.normalizedEmail.toLowerCase() === normalized) return true;
    if (c.aliases && c.aliases.some((a) => aliases.includes(a.toLowerCase()))) return true;
    return false;
  });

  if (existingIndex >= 0) {
    list[existingIndex] = {
      ...list[existingIndex],
      ...record,
      aliases: Array.from(new Set([...(list[existingIndex].aliases || []), ...aliases])),
    };
  } else {
    list.push(record);
  }

  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(list));
    localStorage.setItem(`foss_cred_${cleanInput}`, JSON.stringify(record));
    localStorage.setItem(`foss_cred_${handle}`, JSON.stringify(record));
    if (isAmalAccount) {
      localStorage.setItem("foss_cred_amal", JSON.stringify(record));
      localStorage.setItem("foss_cred_amaldev", JSON.stringify(record));
      localStorage.setItem("foss_cred_amaldev@fossceprn", JSON.stringify(record));
      localStorage.setItem("foss_cred_amal@fossceprn", JSON.stringify(record));
      localStorage.setItem("foss_cred_amal@fossceprn.com", JSON.stringify(record));
      localStorage.setItem("foss_cred_amaldev@fossceprn.com", JSON.stringify(record));
    }
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Error saving assigned credential to localStorage:", err);
  }

  return record;
}

/**
 * Find assigned credential by User ID, email, or handle
 */
export function findAssignedCredential(input: string): AssignedCredential | undefined {
  const clean = input.trim().toLowerCase();
  const normalized = normalizeEmail(clean);
  const handle = clean.includes("@") ? clean.split("@")[0] : clean;

  // 1. Direct key check
  try {
    const keysToCheck = [
      `foss_cred_${clean}`,
      `foss_cred_${handle}`,
      `foss_cred_${normalized}`,
    ];
    if (clean.includes("amal")) {
      keysToCheck.push(
        "foss_cred_amaldev@fossceprn",
        "foss_cred_amaldev",
        "foss_cred_amal@fossceprn",
        "foss_cred_amal",
        "foss_cred_amaldev@fossceprn.com",
        "foss_cred_amal@fossceprn.com"
      );
    }
    for (const k of keysToCheck) {
      const item = localStorage.getItem(k);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && parsed.password) return parsed;
      }
    }
  } catch {}

  // 2. Full list scan
  const list = getAssignedCredentials();

  const found = list.find((c) => {
    if (c.email.toLowerCase() === clean || c.normalizedEmail.toLowerCase() === clean) return true;
    if (c.email.toLowerCase() === normalized || c.normalizedEmail.toLowerCase() === normalized) return true;
    if (c.aliases && c.aliases.some((a) => a.toLowerCase() === clean || a.toLowerCase() === handle || a.toLowerCase() === normalized)) return true;
    return false;
  });

  if (found) return found;

  // 3. Fallback for handle match in saved list
  const fallback = list.find(
    (c) =>
      c.fullName.toLowerCase() === handle ||
      c.email.toLowerCase().includes(handle) ||
      (c.aliases && c.aliases.includes(handle))
  );
  if (fallback) {
    return fallback;
  }

  return undefined;
}

/**
 * Validate credentials against assigned credentials
 */
export function verifyAssignedCredential(
  input: string,
  pass: string
): { matchedUser: boolean; passwordValid: boolean; credential?: AssignedCredential } {
  const cred = findAssignedCredential(input);
  if (!cred) {
    return { matchedUser: false, passwordValid: false };
  }

  const passwordValid = cred.password === pass;
  return { matchedUser: true, passwordValid, credential: cred };
}

// ----------------------------------------------------------------------------
// MEMBERSHIP STATUS (OPEN / CLOSED) MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * Check if membership applications are currently open
 */
export async function getMembershipOpenStatus(): Promise<boolean> {
  const localVal = localStorage.getItem(MEMBERSHIP_STATUS_KEY);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("is_membership_open")
        .limit(1)
        .maybeSingle();

      if (!error && data && typeof data.is_membership_open === "boolean") {
        localStorage.setItem(
          MEMBERSHIP_STATUS_KEY,
          data.is_membership_open ? "true" : "false"
        );
        return data.is_membership_open;
      }
    } catch (err) {
      console.warn("Could not fetch is_membership_open from Supabase:", err);
    }
  }

  // Default to true (open) unless explicitly set to "false"
  return localVal !== "false";
}

/**
 * Toggle or set membership open/close status
 */
export async function setMembershipOpenStatus(isOpen: boolean): Promise<boolean> {
  localStorage.setItem(MEMBERSHIP_STATUS_KEY, isOpen ? "true" : "false");

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ is_membership_open: isOpen, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("site_settings").insert([
          {
            site_name: "FOSS CEPrn",
            is_membership_open: isOpen,
          },
        ]);
      }
    } catch (err) {
      console.warn("Could not persist is_membership_open to Supabase:", err);
    }
  }

  return isOpen;
}
