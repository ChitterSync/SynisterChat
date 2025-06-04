import { NextRequest, NextResponse } from "next/server";
import { setItem, getItem, getAll, clear } from "./secureStore";

// POST /api/storage - Save session data
export async function POST(req: NextRequest) {
  const { id, data } = await req.json();
  if (!id || !data) return NextResponse.json({ error: "Missing id or data" }, { status: 400 });
  setItem(id, data);
  return NextResponse.json({ ok: true });
}

// GET /api/storage?id=... - Get session data
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const data = getItem(id);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }
  // Return all if no id
  return NextResponse.json({ data: getAll() });
}

// DELETE /api/storage - Clear all
export async function DELETE() {
  clear();
  return NextResponse.json({ ok: true });
}
