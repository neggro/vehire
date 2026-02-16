import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const redirect = searchParams.get("redirect");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user and create profile if needed
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists - use type assertion to bypass strict typing
        const { data: existingProfile } = await (supabase as any)
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        // Create profile if it doesn't exist
        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email!.split("@")[0];

          await (supabase as any).from("users").insert({
            id: user.id,
            email: user.email!,
            fullName,
            avatarUrl: user.user_metadata?.avatar_url || null,
            roles: ["USER", "DRIVER"],
            kycStatus: "PENDING",
          });
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirect || next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirect || next}`);
      } else {
        return NextResponse.redirect(`${origin}${redirect || next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
