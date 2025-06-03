import type { Ai } from "@cloudflare/ai";

export interface Env {
  AI: Ai;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
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
    // Decode base64 audio to Uint8Array
    function base64ToUint8Array(base64: string): Uint8Array {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const audioBytes = base64ToUint8Array(audio);
    const audioNumbers = Array.from(audioBytes);
    try {
      // Call Whisper v3 Turbo
      const result = await env.AI.run("@cf/openai/whisper", { audio: audioNumbers });
      // If result is a Uint8Array or ArrayBuffer, convert to string
      let json;
      if (result instanceof Uint8Array) {
        json = JSON.parse(new TextDecoder().decode(result));
      } else if (typeof result === "string") {
        json = JSON.parse(result);
      } else {
        json = result;
      }
      return new Response(JSON.stringify(json), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "AI error" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  }
};
