const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Import process.env for server-side env access
export async function POST(request: Request): Promise<Response> {
    // Next.js handles method routing, so no need to check method here
    let body: any;
    const debug: Record<string, unknown> = {};
    try {
      body = await request.json();
      // Print request body to terminal for debugging
      // eslint-disable-next-line no-console
      console.log("[GPT API] Request body:", JSON.stringify(body, null, 2));
      (debug as any).body = body;
    } catch (err) {
      (debug as any).jsonError = String(err);
      // eslint-disable-next-line no-console
      console.error("[GPT API] JSON parse error:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON", debug }), { status: 400, headers: corsHeaders });
    }
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      (debug as any).messages = messages;
      return new Response(JSON.stringify({ error: "Missing or invalid messages", debug }), { status: 400, headers: corsHeaders });
    }
    // Use GITHUB_TOKEN from environment (per Azure/GitHub AI docs)
    const githubToken = (process.env as any)["GITHUB_TOKEN"] || (process.env as any).GITHUB_TOKEN;
    if (!githubToken) {
      (debug as any).env = process.env;
      return new Response(JSON.stringify({ error: "Missing GITHUB_TOKEN in environment", debug }), { status: 500, headers: corsHeaders });
    }
    // Call GPT-4.1 via Azure/GitHub AI Inference endpoint
    let data: any = null;
    let status = 200;
    let apiError: string | null = null;
    try {
      const response = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${githubToken}`
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1-nano", // Updated to the correct model name per GitHub AI docs
          messages,
          temperature: 1.0,
          top_p: 1.0
        })
      });
      status = response.status;
      (debug as any).apiStatus = status;
      (debug as any).apiHeaders = Object.fromEntries(response.headers.entries());
      data = await response.json();
      (debug as any).apiResponse = data;
      // Print API response to terminal for debugging
      // eslint-disable-next-line no-console
      console.log("[GPT API] API response:", JSON.stringify(data, null, 2));
    } catch (err) {
      apiError = String(err);
      (debug as any).apiError = apiError;
      // eslint-disable-next-line no-console
      console.error("[GPT API] API error:", err);
    }
    // Extract the reply from the completion response (OpenAI format)
    let reply = "";
    if (data && data.choices && data.choices.length > 0) {
      reply = data.choices[0].message?.content || "";
    }
    return new Response(JSON.stringify({ reply, raw: data, debug }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
// For CORS preflight (optional, only if you want to support OPTIONS)
export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}
