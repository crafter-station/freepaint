import { db } from "@/db";
import { paintings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fingerprint = req.nextUrl.searchParams.get("fingerprint");
  if (!fingerprint) {
    return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
  }

  const result = await db
    .select()
    .from(paintings)
    .where(eq(paintings.fingerprint, fingerprint))
    .orderBy(desc(paintings.updatedAt));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fingerprint, name, data } = body;

  if (!fingerprint || !data) {
    return NextResponse.json(
      { error: "Missing fingerprint or data" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(paintings)
    .values({ fingerprint, name: name || "Untitled", data })
    .returning();

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, fingerprint, name, data } = body;

  if (!id || !fingerprint) {
    return NextResponse.json(
      { error: "Missing id or fingerprint" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (data !== undefined) updates.data = data;

  const [result] = await db
    .update(paintings)
    .set(updates)
    .where(eq(paintings.id, id))
    .returning();

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { id, fingerprint } = await req.json();

  if (!id || !fingerprint) {
    return NextResponse.json(
      { error: "Missing id or fingerprint" },
      { status: 400 }
    );
  }

  await db.delete(paintings).where(eq(paintings.id, id));

  return NextResponse.json({ ok: true });
}
