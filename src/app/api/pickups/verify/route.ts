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
    // Allow Donors to verify OTPs
    if (!session || session.role !== "Donor") {
      return NextResponse.json({ message: "Forbidden: Donor access required" }, { status: 403 });
    }

    const { donationId, otpCode } = await req.json();

    if (!donationId || !otpCode) {
      return NextResponse.json({ message: "Donation ID and OTP Code are required" }, { status: 400 });
    }

    // Process the verify using a Prisma interactive transaction.
    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new Error("Donation not found");
      }

      if (donation.donorId !== session.userId) {
        throw new Error("You do not own this donation");
      }

      if (donation.status !== "Reserved") {
        throw new Error("Donation is not in a 'Reserved' state.");
      }

      const pickup = await tx.pickup.findUnique({
        where: { donationId },
      });

      if (!pickup) {
        throw new Error("Pickup record not found");
      }

      if (pickup.otpCode !== parseInt(otpCode)) {
        throw new Error("Invalid OTP");
      }

      // Update the donation status to 'PickedUp'
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: { status: "PickedUp" },
      });

      // Update the Pickup record with finishTime
      const updatedPickup = await tx.pickup.update({
        where: { id: pickup.id },
        data: { finishTime: new Date() },
      });

      return { updatedPickup, updatedDonation };
    });

    return NextResponse.json({
      message: "Handover verified successfully!",
      donation: result.updatedDonation,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Verify OTP error:", error);
    if (error.message === "Invalid OTP" || error.message.includes("not found") || error.message.includes("Reserved")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
