import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role, adminSecret } = await req.json();

    if (!role || !["Donor", "Volunteer", "Admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role selected" }, { status: 400 });
    }

    if (role === "Admin") {
      const EXPECTED_SECRET = process.env.ADMIN_SECRET || "foodbridge-admin-2026";
      if (adminSecret !== EXPECTED_SECRET) {
        return NextResponse.json({ message: "Forbidden: Invalid Admin Secret" }, { status: 403 });
      }
    }

    // Attempt to get the temporary google registration token
    const cookieHeader = req.headers.get("cookie");
    const googleToken = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("google_registration_token="))
      ?.split("=")[1];

    if (!googleToken) {
      return NextResponse.json({ message: "Session expired or invalid. Please try signing in with Google again." }, { status: 401 });
    }

    const payload = await verifyToken(googleToken);
    
    if (!payload || payload.userId !== 0) {
      return NextResponse.json({ message: "Invalid registration session." }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.role; // we temporarily stored name in the role field of the JWT

    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      { message: "Registration complete", user: { id: user.id, name: user.name, role: user.role } },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    // Clear the temporary registration token
    response.cookies.set("google_registration_token", "", { maxAge: 0, path: "/" });

    return response;

  } catch (error: any) {
    console.error("Complete Google Registration Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
