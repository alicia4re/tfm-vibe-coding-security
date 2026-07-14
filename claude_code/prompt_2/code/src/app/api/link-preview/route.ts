import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { fetchLinkPreview } from "@/lib/linkPreview";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "AUTHOR" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);
  return NextResponse.json({ preview });
}
