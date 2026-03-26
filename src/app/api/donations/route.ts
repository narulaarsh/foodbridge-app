import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "Donor") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { foodTitle, quantityKg, expiryTime, lat, lng, address, instructions } = await req.json();

    if (!foodTitle || !quantityKg || !expiryTime || lat === undefined || lng === undefined) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: session.userId,
        foodTitle,
        quantityKg: parseFloat(quantityKg),
        expiryTime: new Date(expiryTime),
        status: "Available",
        lat,
        lng,
        address: address || null,
        instructions: instructions || null,
      },
    });

    return NextResponse.json({ message: "Donation created successfully", donation }, { status: 201 });
  } catch (error: any) {
    console.error("Donation creation error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "Donor") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const donations = await prisma.donation.findMany({
      where: {
        donorId: session.userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({ donations }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch donations error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
