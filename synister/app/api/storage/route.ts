import { setItem, getItem, getAll, clear } from "./secureStore";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// POST /api/storage - Save session data (authenticated)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const { id, data } = await req.json();
  if (!id || !data) return new Response(JSON.stringify({ error: "Missing id or data" }), { status: 400, headers: { "Content-Type": "application/json" } });
  await setItem(id, data, session.user.email);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}

// GET /api/storage?id=... - Get session data (authenticated)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const data = await getItem(id, session.user.email);
    if (!data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ data }), { headers: { "Content-Type": "application/json" } });
  }
  // Return all for this user if no id
  const userData = await getAll(session.user.email);
  return new Response(JSON.stringify({ data: userData }), { headers: { "Content-Type": "application/json" } });
}

// DELETE /api/storage - Clear all session data for user, or single chat if id is provided
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    // Delete a single chat
    const user = await import("./secureStore").then(m => m);
    await user.deleteItem(id, session.user.email);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  await clear(session.user.email);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}
