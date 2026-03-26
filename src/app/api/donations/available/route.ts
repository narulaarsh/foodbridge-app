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
    // Allow Volunteers to view available donations
    if (!session || session.role !== "Volunteer") {
      return NextResponse.json({ message: "Forbidden: Volunteer access required" }, { status: 403 });
    }

    // Fetch 'Available' donations with donor info, ordered by most recent (id descending)
    const availableDonations = await prisma.donation.findMany({
      where: {
        status: "Available",
      },
      include: {
        donor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({ donations: availableDonations }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch available donations error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
