import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const donations = await prisma.donation.findMany({
      include: {
        donor: {
          select: { id: true, name: true, email: true },
        },
        pickup: {
          include: {
            volunteer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ donations }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch admin donations error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
