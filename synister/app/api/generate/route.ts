import type { Ai } from "@cloudflare/ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Next.js Edge API Route Handler
export const runtime = "edge";

function base64ToUint8Array(base64: string): number[] {
  // atob is available in Edge runtime
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Array<number>(len);
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
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }
  const prompt = body.prompt;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return new Response("Missing or invalid prompt", { status: 400, headers: corsHeaders });
  }
  const { image, mask, num_steps, strength, guidance } = body;
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

  // Cloudflare AI HTTP API integration for Edge runtime
  const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({ error: "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // Cloudflare AI HTTP API endpoint for image generation
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/lykon/dreamshaper-8-lcm`;
  const cfRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inputs)
  });
  if (!cfRes.ok) {
    const err = await cfRes.text();
    return new Response(
      JSON.stringify({ error: "Cloudflare AI API error", status: cfRes.status, details: err }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // Cloudflare returns image/png as a stream
  return new Response(cfRes.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/png"
    }
  });
}
