const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/chat.js");

const originalFetch = global.fetch;
const GROQ_API_KEY_NAMES = ["GROQ_API_KEY", ...Array.from({ length: 19 }, (_, indice) => `GROQ_API_KEY_${indice + 2}`)];
const ENV_NAMES = ["SUPABASE_URL", "SUPABASE_ANON_KEY", ...GROQ_API_KEY_NAMES, "GROQ_MODEL", "GROQ_FREE_MODEL", "GROQ_PREMIUM_MODEL"];
const originalEnv = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));

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
        headers: { "content-length": "5000000" },
        body: { mensagens: [{ autor: "usuario", texto: "escala" }] },
    }), response);

    assert.equal(response.statusCode, 413);
});

test("allows repeated free Thonic requests without an application quota", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_FREE_MODEL = "test-groq-free-model";
    process.env.GROQ_PREMIUM_MODEL = "test-groq-premium-model";
    const calls = [];
    const modelosEnviados = [];
    global.fetch = async (url, options = {}) => {
        const destino = String(url);
        calls.push(destino);
        if (destino.endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "free" } }) };
        }
        if (destino.includes("api.groq.com")) {
            modelosEnviados.push(JSON.parse(options.body).model);
            return { ok: true, json: async () => ({ choices: [{ message: { content: "Resposta grátis." } }] }) };
        }
        throw new Error("Thonic Basic must not call a quota service");
    };

    for (let indice = 0; indice < 3; indice++) {
        const response = makeResponse();
        await handler(makeRequest({
            headers: { authorization: "Bearer valid-test-token" },
            body: { mensagens: [{ autor: "usuario", texto: `Pergunta ${indice + 1} sobre acordes?` }] },
        }), response);
        assert.equal(response.statusCode, 200);
    }

    assert.equal(modelosEnviados.length, 3);
    assert.ok(modelosEnviados.every((modelo) => modelo === "test-groq-free-model"));
    assert.equal(calls.some((url) => url.includes("consume_thonic_chat_quota")), false);
});

test("selects the advanced model for a verified Premium account", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_FREE_MODEL = "test-groq-free-model";
    process.env.GROQ_PREMIUM_MODEL = "test-groq-premium-model";
    let modeloEnviado = "";
    global.fetch = async (url, options = {}) => {
        const destino = String(url);
        if (destino.endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "premium" } }) };
        }
        if (destino.includes("api.groq.com")) {
            modeloEnviado = JSON.parse(options.body).model;
            return { ok: true, json: async () => ({ choices: [{ message: { content: "Resposta Premium." } }] }) };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como formar um acorde?" }] },
    }), response);

    assert.equal(response.statusCode, 200);
    assert.equal(modeloEnviado, "test-groq-premium-model");
});

test("keeps the advanced Premium model when a legacy model matches Basic", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_FREE_MODEL = "llama-3.3-70b-versatile";
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    delete process.env.GROQ_PREMIUM_MODEL;
    let modeloEnviado = "";
    global.fetch = async (url, options = {}) => {
        const destino = String(url);
        if (destino.endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "premium" } }) };
        }
        if (destino.includes("api.groq.com")) {
            modeloEnviado = JSON.parse(options.body).model;
            return { ok: true, json: async () => ({ choices: [{ message: { content: "Resposta Premium." } }] }) };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como formar um acorde?" }] },
    }), response);

    assert.equal(response.statusCode, 200);
    assert.equal(modeloEnviado, "openai/gpt-oss-120b");
});

test("validates the session before calling the free Thonic model", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_FREE_MODEL = "llama-3.3-70b-versatile";
    const calls = [];
    global.fetch = async (url, options = {}) => {
        calls.push(String(url));
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "free" } }) };
        }
        if (String(url).includes("api.groq.com")) {
            assert.equal(JSON.parse(options.body).model, "llama-3.3-70b-versatile");
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
    assert.equal(calls.length, 2);
    assert.equal(calls[0].endsWith("/auth/v1/user"), true);
    assert.equal(calls[1].includes("api.groq.com"), true);
});

test("rotates through keys and falls back after a Groq 429", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    for (const name of GROQ_API_KEY_NAMES) delete process.env[name];
    process.env.GROQ_API_KEY = "test-groq-primary";
    process.env.GROQ_API_KEY_2 = "test-groq-backup";
    const triedKeys = [];
    global.fetch = async (url, options = {}) => {
        if (String(url).endsWith("/auth/v1/user")) return { ok: true, json: async () => ({ id: "user-123" }) };
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) return { ok: true, json: async () => true };
        if (String(url).includes("api.groq.com")) {
            triedKeys.push(options.headers.Authorization);
            if (triedKeys.length === 1) return { ok: false, status: 429 };
            return { ok: true, json: async () => ({ choices: [{ message: { content: "Resposta pelo fallback." } }] }) };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como praticar acordes?" }] },
    }), response);

    assert.equal(response.statusCode, 200);
    assert.match(response.body.resposta, /fallback/);
    assert.equal(triedKeys.length, 2);
    assert.equal(new Set(triedKeys).size, 2);
});

test("round-robins the starting key across successive requests", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    for (const name of GROQ_API_KEY_NAMES) delete process.env[name];
    process.env.GROQ_API_KEY = "test-groq-one";
    process.env.GROQ_API_KEY_2 = "test-groq-two";
    process.env.GROQ_API_KEY_3 = "test-groq-three";
    const startingKeys = [];
    global.fetch = async (url, options = {}) => {
        if (String(url).endsWith("/auth/v1/user")) return { ok: true, json: async () => ({ id: "user-123" }) };
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) return { ok: true, json: async () => true };
        if (String(url).includes("api.groq.com")) {
            startingKeys.push(options.headers.Authorization);
            return { ok: true, json: async () => ({ choices: [{ message: { content: "Tudo certo." } }] }) };
        }
        throw new Error("unexpected external request");
    };

    for (let indice = 0; indice < 3; indice++) {
        const response = makeResponse();
        await handler(makeRequest({
            headers: { authorization: "Bearer valid-test-token" },
            body: { mensagens: [{ autor: "usuario", texto: "Como praticar acordes?" }] },
        }), response);
        assert.equal(response.statusCode, 200);
    }

    assert.equal(new Set(startingKeys).size, 3);
});

test("attempts all 20 configured Groq keys before failing over", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    for (const [indice, name] of GROQ_API_KEY_NAMES.entries()) process.env[name] = `test-groq-key-${indice + 1}`;
    const triedKeys = [];
    global.fetch = async (url, options = {}) => {
        if (String(url).endsWith("/auth/v1/user")) return { ok: true, json: async () => ({ id: "user-123" }) };
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) return { ok: true, json: async () => true };
        if (String(url).includes("api.groq.com")) {
            triedKeys.push(options.headers.Authorization);
            return { ok: false, status: 429 };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();

    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: { mensagens: [{ autor: "usuario", texto: "Como praticar acordes?" }] },
    }), response);

    assert.equal(response.statusCode, 502);
    assert.equal(triedKeys.length, 20);
    assert.equal(new Set(triedKeys).size, 20);
});

test("denies attachments unless the verified Supabase app metadata grants Premium", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    let calls = 0;
    global.fetch = async (url) => {
        calls++;
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "free" } }) };
        }
        throw new Error("quota or AI must not be called for non-Premium attachment request");
    };
    const response = makeResponse();
    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: {
            mensagens: [{ autor: "usuario", texto: "Analise o arquivo" }],
            anexos: [{ nome: "acordes.txt", tipo: "text/plain", dados: Buffer.from("Cmaj7").toString("base64") }],
        },
    }), response);
    assert.equal(response.statusCode, 403);
    assert.equal(calls, 1);
});
test("extracts a Premium text attachment and passes its contents to the AI", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    let aiPayload;
    global.fetch = async (url, options = {}) => {
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "premium" } }) };
        }
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) return { ok: true, json: async () => true };
        if (String(url).includes("api.groq.com")) {
            aiPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ choices: [{ message: { content: "O arquivo contém um acorde Cmaj7." } }] }) };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();
    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: {
            mensagens: [{ autor: "usuario", texto: "O que há neste arquivo?" }],
            anexos: [{ nome: "acordes.txt", tipo: "text/plain", dados: Buffer.from("Cmaj7 = dó maior com sétima maior").toString("base64") }],
        },
    }), response);
    assert.equal(response.statusCode, 200);
    assert.match(aiPayload.messages.at(-1).content[0].text, /dó maior com sétima maior/);
});
test("extracts a Premium XLSX attachment after checking archive metadata", async () => {
    process.env.SUPABASE_URL = "https://riff-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Acordes").addRow(["Cmaj7", "dó maior com sétima maior"]);
    const xlsx = Buffer.from(await workbook.xlsx.writeBuffer());
    let aiPayload;
    global.fetch = async (url, options = {}) => {
        if (String(url).endsWith("/auth/v1/user")) {
            return { ok: true, json: async () => ({ id: "user-123", app_metadata: { plan: "premium" } }) };
        }
        if (String(url).endsWith("/rest/v1/rpc/consume_thonic_chat_quota")) return { ok: true, json: async () => true };
        if (String(url).includes("api.groq.com")) {
            aiPayload = JSON.parse(options.body);
            return { ok: true, json: async () => ({ choices: [{ message: { content: "A planilha contém um acorde Cmaj7." } }] }) };
        }
        throw new Error("unexpected external request");
    };
    const response = makeResponse();
    await handler(makeRequest({
        headers: { authorization: "Bearer valid-test-token" },
        body: {
            mensagens: [{ autor: "usuario", texto: "Interprete a planilha" }],
            anexos: [{ nome: "acordes.xlsx", tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dados: xlsx.toString("base64") }],
        },
    }), response);
    assert.equal(response.statusCode, 200);
    assert.match(aiPayload.messages.at(-1).content[0].text, /dó maior com sétima maior/);
});
