import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
    "https://rifftheory.vercel.app",
    "http://localhost:5173",
]);
const EXPECTED_HOSTNAME = "rifftheory.vercel.app";
const EXPECTED_ACTION = "access_monitor";
const encoder = new TextEncoder();

function corsHeaders(origin: string) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
    };
}

function reply(origin: string, status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
    });
}

function signaturesEqual(a: string, b: string): boolean {
    let difference = a.length ^ b.length;
    const length = Math.max(a.length, b.length);
    for (let index = 0; index < length; index += 1) {
        difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
    }
    return difference === 0;
}

function getSupabaseSecretKey(): string {
    try {
        const raw = Deno.env.get("SUPABASE_SECRET_KEYS") || "{}";
        const keys = JSON.parse(raw);
        if (typeof keys.default === "string") return keys.default;
    } catch {
        // O fallback legado abaixo cobre ambientes Supabase antigos.
    }
    return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function deriveDeviceSignature(deviceId: string, rootSecret: string): Promise<string> {
    const material = await crypto.subtle.importKey(
        "raw",
        encoder.encode(rootSecret),
        "HKDF",
        false,
        ["deriveKey"],
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: encoder.encode("riff-theory-access-monitor-v1"),
            info: encoder.encode("device-id-signature"),
        },
        material,
        { name: "HMAC", hash: "SHA-256", length: 256 },
        false,
        ["sign", "verify"],
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`riff-theory-device:${deviceId}`),
    );
    const bytes = new Uint8Array(signature);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
    const form = new URLSearchParams({ secret, response: token });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true
        && result.hostname === EXPECTED_HOSTNAME
        && result.action === EXPECTED_ACTION;
}

Deno.serve(async (request: Request) => {
    const origin = request.headers.get("origin") || "";
    if (!ALLOWED_ORIGINS.has(origin)) {
        return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
            status: 403,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") return reply(origin, 405, { error: "method_not_allowed" });

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4096) return reply(origin, 413, { error: "payload_too_large" });
    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return reply(origin, 400, { error: "invalid_body" });
    }
    if (rawBody.length > 4096) return reply(origin, 413, { error: "payload_too_large" });

    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = getSupabaseSecretKey();
    if (!turnstileSecret || !supabaseUrl || !serviceKey) {
        return reply(origin, 503, { error: "access_monitor_not_configured" });
    }

    let payload: Record<string, unknown>;
    try {
        const decoded: unknown = JSON.parse(rawBody);
        if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
            return reply(origin, 400, { error: "invalid_json" });
        }
        payload = decoded as Record<string, unknown>;
    } catch {
        return reply(origin, 400, { error: "invalid_json" });
    }

    const deviceId = payload.p_device_id;
    const sessionId = payload.p_session_id;
    const deviceSignature = payload.device_signature;
    const turnstileToken = payload.turnstile_token;

    if (typeof deviceId !== "string" || deviceId.length < 16 || deviceId.length > 128
        || typeof sessionId !== "string" || sessionId.length < 16 || sessionId.length > 128
        || typeof turnstileToken !== "string" || turnstileToken.length < 20 || turnstileToken.length > 4096
        || (deviceSignature !== null && deviceSignature !== undefined
            && (typeof deviceSignature !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(deviceSignature)))) {
        return reply(origin, 400, { error: "invalid_payload" });
    }

    try {
        const captchaValid = await verifyTurnstile(turnstileToken, turnstileSecret);
        if (!captchaValid) return reply(origin, 403, { error: "captcha_verification_failed" });

        const expectedSignature = await deriveDeviceSignature(deviceId, turnstileSecret);
        if (typeof deviceSignature === "string" && !signaturesEqual(deviceSignature, expectedSignature)) {
            return reply(origin, 403, { error: "device_signature_invalid" });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error } = await supabaseAdmin.rpc("register_anonymous_access", {
            p_device_id: deviceId,
            p_session_id: sessionId,
            p_path: null,
            p_user_agent: null,
        });
        if (error) {
            if (error.message?.includes("access_rate_limited")) {
                return reply(origin, 429, { error: "access_rate_limited" });
            }
            return reply(origin, 500, { error: "access_registration_failed" });
        }

        return reply(origin, 200, {
            ok: true,
            device_signature: expectedSignature,
        });
    } catch {
        // Não registrar headers, request body, segredo ou dados de rede nos logs.
        return reply(origin, 503, { error: "access_monitor_unavailable" });
    }
});
