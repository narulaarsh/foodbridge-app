import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (error) {
      console.error("Google OAuth Error:", error);
      return NextResponse.redirect(`${appUrl}/auth?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/auth?error=No+code+provided`);
    }

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.redirect(`${appUrl}/auth?error=Server+misconfiguration`);
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // 1. Exchange access code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();
      console.error("Failed to exchange token:", tokenError);
      return NextResponse.redirect(`${appUrl}/auth?error=Failed+to+exchange+token`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      console.error("Failed to fetch profile:", profileError);
      return NextResponse.redirect(`${appUrl}/auth?error=Failed+to+fetch+profile`);
    }

    const profileData = await profileRes.json();
    const email = profileData.email;
    const name = profileData.name || "Google User";

    if (!email) {
      return NextResponse.redirect(`${appUrl}/auth?error=No+email+returned+from+Google`);
    }

    // 3. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // User doesn't exist, we must ask for a role
      // Create a temporary JWT holding their name and email
      const pendingToken = await signToken({
        userId: 0, // 0 to signify pending
        email,
        role: name, // temporarily store name in role field to avoid changing JWTPayload interface
      });

      const response = NextResponse.redirect(`${appUrl}/auth?setup_role=true`);
      
      response.cookies.set("google_registration_token", pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15, // 15 mins
        path: "/",
      });

      return response;
    }

    // 4. Create Custom Session JWT for existing user
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Build response with cookie and redirect
    const userRole = user.role.toLowerCase();
    const response = NextResponse.redirect(`${appUrl}/${userRole}`);
    
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;

  } catch (err: any) {
    console.error("Google Callback Exception:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/auth?error=Internal+Server+Error`);
  }
}
