import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(url && anonKey);
export const supabase = authConfigured ? createClient(url, anonKey) : null;

export function getAvatarUrl(user) {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
}

export function getDisplayName(user) {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Músico";
}
