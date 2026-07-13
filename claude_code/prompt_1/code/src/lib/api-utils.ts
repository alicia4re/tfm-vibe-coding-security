import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Datos no válidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (error instanceof Error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
