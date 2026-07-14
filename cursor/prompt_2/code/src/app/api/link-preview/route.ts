import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "URL obligatoria" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URL no válida" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);
  return NextResponse.json({ preview });
}
