// Cleaned up for Edge/Worker compatibility, no Node.js Buffer, no unused helpers, no unnecessary types
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
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }
    const prompt = body.prompt;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response("Missing or invalid prompt", { status: 400, headers: corsHeaders });
    }
    const { image, mask, num_steps, strength, guidance } = body;

    // Helper to decode base64 to number[]
    function base64ToUint8Array(base64: string): number[] {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Array<number>(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    const inputs: {
      prompt: string;
      image?: number[];
      mask?: number[];
      num_steps?: number;
      strength?: number;
      guidance?: number;
    } = { prompt };
    if (image) inputs.image = base64ToUint8Array(image);
    if (mask) inputs.mask = base64ToUint8Array(mask);
    if (num_steps) inputs.num_steps = num_steps;
    if (strength) inputs.strength = strength;
    if (guidance) inputs.guidance = guidance;

    const imageStream = await env.AI.run(
      "@cf/lykon/dreamshaper-8-lcm",
      inputs
    );
    return new Response(imageStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png"
      }
    });
  }
};
