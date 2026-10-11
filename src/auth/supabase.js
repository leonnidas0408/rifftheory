import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function isValidHttpUrl(value) {
    try {
        const parsed = new URL(value);
        return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

export const authConfigured = isValidHttpUrl(url) && Boolean(anonKey);
export const supabase = authConfigured ? createClient(url, anonKey) : null;

export function getAvatarUrl(user) {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
}

export function getDisplayName(user) {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Músico";
}
