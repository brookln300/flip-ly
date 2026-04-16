import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.CLAUDECODE_BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ALLOWED_CHAT_IDS = (process.env.CLAUDECODE_ALLOWED_CHATS || process.env.ALLOWED_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);

// ─── Telegram helpers ───────────────────────────────────────────
async function sendMessage(chatId: number | string, text: string, opts: Record<string, unknown> = {}) {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...opts }),
  });
  return res.json();
}

// ─── Safe math evaluator (no eval/Function) ────────────────────
function safeMathEval(expr: string): number | null {
  const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g);
  if (!tokens) return null;
  let pos = 0;
  function parseExpr(): number {
    let result = parseTerm();
    while (pos < tokens!.length && (tokens![pos] === '+' || tokens![pos] === '-')) {
      const op = tokens![pos++];
      const right = parseTerm();
      result = op === '+' ? result + right : result - right;
    }
    return result;
  }
  function parseTerm(): number {
    let result = parseFactor();
    while (pos < tokens!.length && (tokens![pos] === '*' || tokens![pos] === '/')) {
      const op = tokens![pos++];
      const right = parseFactor();
      result = op === '*' ? result * right : result / right;
    }
    return result;
  }
  function parseFactor(): number {
    if (tokens![pos] === '(') {
      pos++;
      const result = parseExpr();
      if (tokens![pos] === ')') pos++;
      return result;
    }
    if (tokens![pos] === '-') {
      pos++;
      return -parseFactor();
    }
    const num = parseFloat(tokens![pos++]);
    if (isNaN(num)) return 0;
    return num;
  }
  try {
    const result = parseExpr();
    if (!isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

// ─── Command handlers ───────────────────────────────────────────
const COMMANDS: Record<string, (chatId: number, args: string) => Promise<string>> = {
  start: async () => {
    return [
      "<b>Claude Code Bot</b>",
      "",
      "General-purpose assistant. Commands:",
      "",
      "/ping - Check if bot is alive",
      "/time - Current server time",
      "/ip - Server IP info",
      "/calc - Quick math",
      "/remind - Echo back a reminder",
      "/note - Save a quick note",
      "/help - Show this message",
    ].join("\n");
  },

  help: async () => {
    return [
      "<b>Claude Code Bot</b>",
      "",
      "/ping - Alive check",
      "/time - Server time",
      "/ip - Server IP",
      "/calc 2+2 - Quick math",
      "/remind msg - Reminder",
      "/note text - Save note",
    ].join("\n");
  },

  ping: async () => `🏓 Pong! <code>${new Date().toISOString()}</code>`,

  time: async () => {
    const now = new Date();
    const cdt = now.toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "full", timeStyle: "long" });
    const utc = now.toISOString();
    return `🕐 <b>CDT:</b> ${cdt}\n🌍 <b>UTC:</b> ${utc}`;
  },

  ip: async () => "ℹ️ IP info disabled for security.",

  calc: async (_chatId: number, args: string) => {
    if (!args) return "Usage: /calc <expression>\nExample: /calc 2 + 2";
    try {
      const sanitized = args.replace(/[^0-9+\-*/.() ]/g, "");
      if (!sanitized || sanitized.length > 100) return "❌ Invalid expression";
      const result = safeMathEval(sanitized);
      if (result === null) return "❌ Could not evaluate expression";
      return `🧮 <code>${args}</code> = <b>${result}</b>`;
    } catch {
      return "❌ Could not evaluate expression";
    }
  },

  remind: async (_chatId: number, args: string) => {
    if (!args) return "Usage: /remind <message>";
    return `🔔 <b>Reminder set:</b> ${args}\n\n<i>(Note: This echoes your reminder. Scheduled reminders use Claude scheduled tasks.)</i>`;
  },

  note: async (_chatId: number, args: string) => {
    if (!args) return "Usage: /note <text>";
    // Store in-memory for this serverless invocation — persistent notes would need a DB
    return `📌 <b>Noted:</b> ${args}\n\n<i>Tip: For persistent notes, use Todoist via @ClawDirectorGroupBot</i>`;
  },
};

// ─── Webhook handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;

    // Auth: only respond to allowed chats
    if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(String(chatId))) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text.trim();

    // Parse command
    const match = text.match(/^\/(\w+)(@\w+)?([\s\S]*)$/);
    if (match) {
      const cmd = match[1].toLowerCase();
      const args = (match[3] || "").trim();
      const handler = COMMANDS[cmd];

      if (handler) {
        const response = await handler(chatId, args);
        console.log("[CLAUDECODE BOT] cmd:", cmd, "response length:", response.length);
        const sent = await sendMessage(chatId, response);
        console.log("[CLAUDECODE BOT] sendMessage result:", JSON.stringify(sent));
      } else {
        await sendMessage(chatId, "Unknown command: /" + cmd + "\n\nType /help for available commands.");
      }
    } else {
      await sendMessage(chatId, "You said: " + text.slice(0, 200) + "\n\nUse /help for commands.");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CLAUDECODE BOT] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Claude Code bot webhook active" });
}
