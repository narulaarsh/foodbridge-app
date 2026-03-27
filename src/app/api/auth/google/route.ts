import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.json(
      { message: "Server misconfiguration: Google Client ID not set" },
      { status: 500 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
  const responseType = "code";

  // State is normally required for CSRF protection, we will use a simple fixed one for now or skip it.
  const state = "google_auth_state"; 

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.append("client_id", clientId);
  googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.append("response_type", responseType);
  googleAuthUrl.searchParams.append("scope", scope);
  googleAuthUrl.searchParams.append("state", state);
  googleAuthUrl.searchParams.append("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
