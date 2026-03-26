import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
    }

    // Prevent Admin from deleting themselves
    if (userId === session.userId) {
      return NextResponse.json({ message: "You cannot delete your own account" }, { status: 403 });
    }

    // Manual cascading deletion utilizing a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      // 1. Delete pickups where the user was the volunteer
      await tx.pickup.deleteMany({
        where: { volunteerId: userId }
      });

      // 2. Delete pickups for donations that belong to this donor
      await tx.pickup.deleteMany({
        where: { donation: { donorId: userId } }
      });

      // 3. Delete donations belonging to this donor
      await tx.donation.deleteMany({
        where: { donorId: userId }
      });

      // 4. Delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ message: "User securely deleted" }, { status: 200 });

  } catch (error: any) {
    console.error("Delete user error:", error);
    if (error.message === "User not found") {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
