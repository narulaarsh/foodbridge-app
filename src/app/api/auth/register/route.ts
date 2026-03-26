import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, adminSecret } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (!["Donor", "Volunteer", "Admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (role === "Admin") {
      const EXPECTED_SECRET = process.env.ADMIN_SECRET || "foodbridge-admin-2026";
      if (adminSecret !== EXPECTED_SECRET) {
        return NextResponse.json({ message: "Forbidden: Invalid Admin Secret" }, { status: 403 });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    return NextResponse.json({ message: "User registered successfully", userId: newUser.id }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: error?.message || String(error) }, { status: 500 });
  }
}
