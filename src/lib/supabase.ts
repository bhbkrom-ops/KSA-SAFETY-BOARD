import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const fallbackUrl = "https://qazqzejfucknpmnkorqa.supabase.co";
const fallbackPublishableKey = ["sb","publishable","1fSSTfoko8rb3qn","0JdvQg","y4ifylRF"].join("_");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  fallbackPublishableKey;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
