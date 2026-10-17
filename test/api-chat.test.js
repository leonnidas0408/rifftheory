const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/chat.js");

const originalFetch = global.fetch;
const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
};

function makeResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
}

function makeRequest({ method = "POST", headers = {}, body = {} } = {}) {
    return { method, headers, body };
}

function restoreEnvironment() {
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    global.fetch = originalFetch;
}

test.afterEach(restoreEnvironment);

test("rejects non-POST requests without contacting dependencies", async () => {
    global.fetch = async () => { throw new Error("fetch must not run"); };
    const response = makeResponse();

    await handler(makeRequest({ method: "GET" }), response);

    assert.equal(response.statusCode, 405);
});

test("rejects unauthenticated calls before any external request", async () => {
    global.fetch = async () => { throw new Error("fetch must not run"); };
    const response = makeResponse();

    await handler(makeRequest({ body: { mensagens: [{ autor: "usuario", texto: "escala" }] } }), response);

    assert.equal(response.statusCode, 401);
});

test("blocks request bodies above the configured size before authentication", async () => {
    global.fetch = async () => { throw new Error("fetch must not run"); };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { "content-length": "70000" },
        body: { mensagens: [{ autor: "usuario", texto: "escala" }] },
    }), response);

    assert.equal(response.statusCode, 413);
});

test("blocks over-quota users without calling the AI provider", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    const calls = [];
    global.fetch = async (url) => {
        calls.push(String(url));
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123" }) };
        }
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) {
            return { ok: true, json: async () => false };
        }
        throw new Error("AI provider must not be called for a denied quota");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como formar um acorde?" }] },
    }), response);

    assert.equal(response.statusCode, 429);
    assert.equal(calls.length, 2);
    assert.equal(calls.some((url) => url.includes("api.groq.com")), false);
});

test("fails closed when the persistent quota service is unavailable", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    const calls = [];
    global.fetch = async (url) => {
        calls.push(String(url));
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123" }) };
        }
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) {
            return { ok: false, status: 503 };
        }
        throw new Error("AI provider must not be called if quota checking fails");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como formar um acorde?" }] },
    }), response);

    assert.equal(response.statusCode, 503);
    assert.equal(calls.length, 2);
    assert.equal(calls.some((url) => url.includes("api.groq.com")), false);
});

test("calls the AI only after session validation and persistent quota approval", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    const calls = [];
    global.fetch = async (url) => {
        calls.push(String(url));
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123" }) };
        }
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) {
            return { ok: true, json: async () => true };
        }
        if (String(url).includes("api.groq.com")) {
            return {
                ok: true,
                json: async () => ({ choices: [{ message: { content: "Um acorde maior tem terça maior e quinta justa." } }] }),
            };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como formar um acorde?" }] },
    }), response);

    assert.equal(response.statusCode, 200);
    assert.match(response.body.resposta, /terça maior/);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].endsWith("/auth/v1/user"), true);
    assert.equal(calls[1].endsWith("/rest/v1/rpc/consume_thonic_chat_quota"), true);
    assert.equal(calls[2].includes("api.groq.com"), true);
});
