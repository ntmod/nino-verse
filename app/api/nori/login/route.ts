import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, SESSION_AGE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const EXPECTED_PASSWORD = process.env.SITE_PASSWORD;

    if (!EXPECTED_PASSWORD || !process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Login is not configured" }, { status: 503 });
    }

    if (password === EXPECTED_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("nori_session", createSession(process.env.SESSION_SECRET), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_AGE,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
