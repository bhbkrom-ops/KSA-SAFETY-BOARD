import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

type ServerDatabase = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};

const staffRoles = new Set([
  "super_admin",
  "hse_manager",
  "hse_leader",
  "hse_supervisor",
  "senior_safety_officer",
  "safety_officer",
  "auditor",
]);

export type ServerProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role_code: string;
  is_active: boolean;
};

export type AuthContext = {
  client: SupabaseClient<ServerDatabase>;
  user: User;
  profile: ServerProfile;
  isStaff: boolean;
};

export async function requireAuth(request: NextRequest): Promise<AuthContext | Response> {
  const fallbackUrl = "https://qazqzejfucknpmnkorqa.supabase.co";
  const fallbackKey = ["sb","publishable","1fSSTfoko8rb3qn","0JdvQg","y4ifylRF"].join("_");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || fallbackUrl;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    fallbackKey;
  const authorization = request.headers.get("authorization");
  if (!url || !key || !authorization?.startsWith("Bearer ")) {
    return Response.json({ ok: false, error: "Authentication is required." }, { status: 401 });
  }

  const client = createClient<ServerDatabase>(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ ok: false, error: "Your session is invalid or expired." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,display_name,email,role_code,is_active")
    .eq("id", userData.user.id)
    .maybeSingle();
  const typedProfile = profile as ServerProfile | null;
  if (profileError || !typedProfile || !typedProfile.is_active) {
    return Response.json({ ok: false, error: "Your HSE profile is not active." }, { status: 403 });
  }

  return { client, user: userData.user, profile: typedProfile, isStaff: staffRoles.has(typedProfile.role_code) };
}

export function isAuthContext(value: AuthContext | Response): value is AuthContext {
  return value instanceof Response === false;
}
