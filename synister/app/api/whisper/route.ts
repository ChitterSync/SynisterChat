import type { Ai } from "@cloudflare/ai";

export interface Env {
  AI: Ai;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export const runtime = "edge";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }
  const { audio } = body;
  if (!audio || typeof audio !== "string" || !audio.trim()) {
    return new Response(JSON.stringify({ error: "Missing or invalid audio" }), { status: 400, headers: corsHeaders });
  }
  const audioBytes = base64ToUint8Array(audio);
  const audioNumbers = Array.from(audioBytes);

  // Cloudflare AI HTTP API integration for Edge runtime
  const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({ error: "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // Cloudflare AI HTTP API endpoint for Whisper
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/openai/whisper`;
  const cfRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ audio: audioNumbers })
  });
  if (!cfRes.ok) {
    const err = await cfRes.text();
    return new Response(
      JSON.stringify({ error: "Cloudflare AI API error", status: cfRes.status, details: err }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const result = await cfRes.json();
  return new Response(JSON.stringify(result), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
