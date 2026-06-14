export type Role = "student" | "company" | "admin";

export interface User {
  id: number;
  email: string;
  role: Role;
  full_name: string | null;
  is_active: boolean;
  locale?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  role?: Role;
  user_id?: number;
}

export interface University {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  type: string;
  city: string;
  governorate: string;
  latitude: number;
  longitude: number;
  website?: string | null;
}

export interface Company {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  industry?: string;
  fields?: string;
  size?: string | null;
  city: string;
  governorate: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  email?: string | null;
  training_fields: string | string[];
  is_strategic_partner: boolean;
  is_approved: boolean;
  logo_url?: string | null;
  address?: string | null;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  full_name: string;
  major: string;
  university_id: number | null;
  university?: University | null;
  gpa: number;
  experience_years: number;
  skills: string;
  knowledge_areas: string;
  home_city: string;
  home_governorate: string;
  home_latitude: number | null;
  home_longitude: number | null;
}

export interface MatchBreakdown {
  skills: number;
  field: number;
  geo: number;
  university: number;
  experience: number;
  partner_boost: number;
}

export interface RecommendationItem {
  company: Company;
  internship?: Internship | null;
  score: number;
  distance_km: number;
  reasons: string[];
  breakdown: MatchBreakdown;
}

export interface RecommendationOut {
  items: RecommendationItem[];
  student_home: { lat: number; lng: number; city: string } | null;
}

export interface AnalyticsOverview {
  universities: number;
  companies: number;
  strategic_partners: number;
  internships: number;
  students: number;
  applications: number;
}

export interface Internship {
  id: number;
  company_id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  required_skills: string;
  knowledge_areas: string;
  required_experience: number;
  duration_weeks: number;
  is_remote: boolean;
  is_open: boolean;
  created_at?: string;
}

export interface InternshipWithCompany extends Internship {
  company: Company;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Application {
  id: number;
  student_user_id: number;
  internship_id: number;
  company_id: number;
  status: ApplicationStatus;
  cover_letter: string;
  match_score: number;
  skills_score: number;
  geo_score: number;
  field_score: number;
  experience_score: number;
  created_at?: string;
}

// -------- Admin panel rows --------
export interface AdminUserRow {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  locale: string;
  created_at?: string | null;
  full_name?: string | null;
}

export interface AdminStudentRow {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  major: string;
  university_id: number | null;
  university_name: string | null;
  gpa: number;
  experience_years: number;
  skills: string;
  knowledge_areas: string;
  home_city: string;
  home_governorate: string;
  is_active: boolean;
  created_at?: string | null;
}

export interface AdminCompanyRow {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  industry: string;
  city: string;
  governorate: string;
  size: string;
  is_strategic_partner: boolean;
  website?: string | null;
  logo_url?: string | null;
  owner_user_id?: number | null;
  open_internships: number;
  applications_count: number;
  email?: string | null;
}

export interface AdminUniversityRow {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  type: string;
  city: string;
  governorate: string;
  website?: string | null;
  students_count: number;
}

export interface AdminInternshipRow {
  id: number;
  company_id: number;
  company_name: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  required_skills: string;
  knowledge_areas: string;
  required_experience: number;
  duration_weeks: number;
  is_remote: boolean;
  is_open: boolean;
  applications_count: number;
  created_at?: string | null;
}

export interface AdminApplicationRow {
  id: number;
  student_user_id: number;
  student_email: string;
  student_name: string;
  internship_id: number;
  internship_title: string;
  company_id: number;
  company_name: string;
  status: ApplicationStatus;
  match_score: number;
  cover_letter: string;
  created_at?: string | null;
}

export interface AdminStats {
  users: number;
  students: number;
  companies: number;
  universities: number;
  internships: number;
  applications: number;
  strategic_partners: number;
  active_users: number;
  pending_companies: number;
}

export interface AdminPendingCompanyRow {
  id: number;
  name_en: string;
  name_ar: string;
  email: string | null;
  city: string;
  governorate: string;
  industry: string | null;
  size: string | null;
  created_at: string | null;
}

