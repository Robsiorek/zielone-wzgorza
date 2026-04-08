import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/admin/login", baseUrl));
  response.headers.set("Set-Cookie", clearAuthCookie());
  return response;
}
