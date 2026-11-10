export type PublicationStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "upcoming" | "open" | "closing_soon" | "closed" | "ended";
export type AdminRole = "super_admin" | "admin" | "editor" | "viewer" | "faculty";
export type MembershipStatus = "active" | "inactive" | "pending";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  department: string | null;
  semester: string | null;
  student_id: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  membership_status?: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: AdminRole | "member";
}

export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  github_url: string | null;
  instagram_url: string | null;
  is_membership_open?: boolean;
  updated_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  venue: string;
  start_date: string;
  end_date: string | null;
  registration_status: RegistrationStatus;
  publication_status: PublicationStatus;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  github_url: string | null;
  technologies: string[];
  publication_status: PublicationStatus;
  is_featured?: boolean;
  created_at: string;
}

export interface ExecomMember {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  semester?: string | null;
  phone_number?: string | null;
  photo_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean;
  email?: string | null;
  user_id?: string | null;
  login_password?: string | null;
  role?: AdminRole | null;
  created_at: string;
}

export type ActivityCategory =
  | "Workshop"
  | "Hackathon"
  | "Meeting"
  | "Coding Session"
  | "Technical Talk"
  | "Community Event"
  | "Announcement"
  | "Other";

export type ActivityStatus = "draft" | "published" | "completed" | "archived";

export interface ActivityVolunteer {
  name: string;
  task: string;
  member_id?: string | null;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  activity_date: string; // YYYY-MM-DD
  deadline_date?: string | null; // Date of deadline
  start_time: string;    // e.g. "10:00 AM" or "14:30"
  end_time?: string | null;
  venue: string;
  category: ActivityCategory;
  status: ActivityStatus;
  coordinators?: string[]; // Any 2 ExeCom approved coordinators
  volunteers?: ActivityVolunteer[]; // 1 to 10 ExeCom approved volunteers with assigned tasks
  created_by: string;
  created_by_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export type ExecomApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface ExecomApplication {
  id: string;
  full_name: string;
  email: string;
  department: string;
  semester: string;
  desired_role: string;
  github_url?: string | null;
  linkedin_url?: string | null;
  statement_of_purpose: string;
  status: ExecomApplicationStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export type MemberApplicationStatus = "pending" | "approved" | "rejected";

export interface MemberApplication {
  id: string;
  full_name: string;
  email: string;
  department: string;
  semester: string;
  github_url?: string | null;
  interest: string;
  notes?: string | null;
  status: MemberApplicationStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  description: string | null;
  category: string;
  event_id: string | null;
  created_at: string;
}

export type AnnouncementType = "info" | "warning" | "success" | "event";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  type?: AnnouncementType;
  publication_status?: PublicationStatus;
  is_active?: boolean;
  link_url?: string | null;
  priority?: number;
  starts_at?: string | null;
  expires_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ActivityLogItem {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details?: any;
  created_at: string;
  actor_email?: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
  profile?: Partial<Profile>;
  email: string;
  full_name?: string;
}

export interface HighlightStat {
  label: string;
  value: string | number;
  description: string;
  isPlaceholder?: boolean;
}
