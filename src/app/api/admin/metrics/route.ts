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

    const reservedDonations = await prisma.donation.count({
      where: { status: "Reserved" }
    });

    const completedDonations = await prisma.donation.count({
      where: { status: "PickedUp" }
    });

    const totalDonations = await prisma.donation.count();

    const foodRescuedAggregate = await prisma.donation.aggregate({
      _sum: { quantityKg: true },
      where: { status: "PickedUp" }
    });

    const totalFoodPosted = await prisma.donation.aggregate({
      _sum: { quantityKg: true }
    });

    const totalFoodRescued = foodRescuedAggregate._sum.quantityKg || 0;

    const donorCount = await prisma.user.count({ where: { role: "Donor" } });
    const volunteerCount = await prisma.user.count({ where: { role: "Volunteer" } });
    const adminCount = await prisma.user.count({ where: { role: "Admin" } });

    const totalPickups = await prisma.pickup.count();
    const completedPickups = await prisma.pickup.count({
      where: { finishTime: { not: null } }
    });

    return NextResponse.json({ 
      metrics: {
        totalUsers,
        activeDonations,
        reservedDonations,
        completedDonations,
        totalDonations,
        totalFoodRescued,
        totalFoodPosted: totalFoodPosted._sum.quantityKg || 0,
        donorCount,
        volunteerCount,
        adminCount,
        totalPickups,
        completedPickups,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch metrics error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
