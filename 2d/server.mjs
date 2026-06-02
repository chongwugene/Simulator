import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4174);
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_BODY_BYTES = 1_000_000;
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const ALLOWED_ACTIONS = new Set([
  "reset_upstream_gfci",
  "test_upstream_gfci",
  "reset_breaker",
  "turn_breaker_on",
  "turn_breaker_off",
  "plug_source",
  "unplug_source",
  "clear_last_trip"
]);

const SYSTEM_PROMPT = [
  "You are an electrical-wiring simulator diagnostic assistant.",
  "Use only the provided simulator snapshot. Do not give real-world installation advice.",
  "Answer the user's specific why question from the graph state, not just whether a trip exists.",
  "For dead outlets or receptacles, name the relevant device or box and state which hot/neutral terminal is missing, open, dead, or incorrectly connected.",
  "For grounding and trip questions, distinguish an open/missing equipment ground from an actual hot-ground fault; an open ground alone does not trip.",
  "For GFCI, switch, and split receptacle questions, mention the specific modeled nuance that controls the result.",
  "If the diagnostic is correct, explain the exact graph path or missing path in plain language.",
  "If the diagnostic appears stale or wrong for this simulator run, propose only safe simulator-state actions from the allowed list.",
  "Do not modify the simulator automatically; the user must accept any proposal.",
  "Return JSON only with this shape: {\"reply\":\"...\",\"proposal\":null|{\"title\":\"...\",\"reason\":\"...\",\"actions\":[{\"type\":\"reset_breaker\"}]}}.",
  `Allowed action types: ${Array.from(ALLOWED_ACTIONS).join(", ")}.`
].join(" ");

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (request.method === "POST" && url.pathname === "/api/diagnostics-chat") {
      await handleDiagnosticChat(request, response);
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }
    await serveStatic(url.pathname, response, request.method === "HEAD");
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Electrical wiring simulator running at http://localhost:${PORT}/`);
});

async function handleDiagnosticChat(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, { error: "Set OPENAI_API_KEY to enable OpenAI diagnostics chat." });
    return;
  }
  const payload = await readJsonBody(request);
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(payload) }
      ],
      reasoning: { effort: "minimal" },
      max_output_tokens: 900,
      store: false
    })
  });
  const data = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, { error: data.error?.message || "OpenAI API request failed." });
    return;
  }
  const text = data.output_text || collectOutputText(data) || "";
  const parsed = parseAssistantJson(text);
  sendJson(response, 200, {
    reply: parsed.reply || text || "I could not produce a diagnostic explanation.",
    proposal: validateProposal(parsed.proposal),
    source: "openai"
  });
}

async function serveStatic(urlPath, response, headOnly) {
  const requested = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  try {
    const extension = path.extname(filePath);
    let body = await readFile(filePath);
    if (extension === ".html") {
      const version = String(Date.now());
      body = Buffer.from(
        body.toString("utf8")
          .replaceAll("__SIM_SERVER_ASSET_VERSION__", version),
        "utf8"
      );
    }
    response.writeHead(200, {
      "Content-Type": MIME[extension] || "application/octet-stream",
      ...NO_CACHE_HEADERS
    });
    if (!headOnly) response.end(body);
    else response.end();
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function collectOutputText(data) {
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n");
}

function parseAssistantJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return { reply: text, proposal: null };
      }
    }
    return { reply: text, proposal: null };
  }
}

function validateProposal(proposal) {
  if (!proposal || !Array.isArray(proposal.actions)) return null;
  const actions = proposal.actions
    .filter((action) => action && ALLOWED_ACTIONS.has(action.type))
    .map((action) => ({ type: action.type }));
  if (!actions.length) return null;
  return {
    title: String(proposal.title || "Suggested simulator update"),
    reason: String(proposal.reason || "Apply this update to the current simulator run."),
    actions
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...NO_CACHE_HEADERS });
  response.end(JSON.stringify(body));
}
