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
    // Allow Volunteers to claim donations
    if (!session || session.role !== "Volunteer") {
      return NextResponse.json({ message: "Forbidden: Volunteer access required" }, { status: 403 });
    }

    const { donationId } = await req.json();

    if (!donationId) {
      return NextResponse.json({ message: "Donation ID is required" }, { status: 400 });
    }

    // Process the claim using a Prisma interactive transaction.
    // 1. Verify donation is still 'Available'
    // 2. Set to 'Reserved'
    // 3. Generate OTP
    // 4. Create Pickup record
    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new Error("Donation not found");
      }

      if (donation.status !== "Available") {
        throw new Error("This donation has already been claimed or picked up.");
      }

      // Generate a 4 digit random OTP between 1000 and 9999
      const otpCode = Math.floor(1000 + Math.random() * 9000);

      // Update the donation status to 'Reserved'
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: { status: "Reserved" },
      });

      // Create a new Pickup record
      const pickup = await tx.pickup.create({
        data: {
          donationId: updatedDonation.id,
          volunteerId: session.userId,
          otpCode: otpCode,
          claimTime: new Date(),
        },
      });

      return { pickup, updatedDonation };
    });

    return NextResponse.json({
      message: "Donation successfully claimed",
      otpCode: result.pickup.otpCode,
      pickup: result.pickup,
      donation: result.updatedDonation,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Claim donation error:", error);
    if (error.message.includes("already been claimed")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
