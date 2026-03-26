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

    const totalUsers = await prisma.user.count();
    
    const activeDonations = await prisma.donation.count({
      where: { status: "Available" }
    });

    const foodRescuedAggregate = await prisma.donation.aggregate({
      _sum: {
        quantityKg: true
      },
      where: {
        status: "PickedUp"
      }
    });

    const totalFoodRescued = foodRescuedAggregate._sum.quantityKg || 0;

    return NextResponse.json({ 
      metrics: {
        totalUsers,
        activeDonations,
        totalFoodRescued
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch metrics error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
