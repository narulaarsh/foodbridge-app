import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // If already logged in, redirect to dashboard
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    const session = await verifyToken(token);
    if (session) redirect(`/${session.role.toLowerCase()}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-gray-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight">FoodBridge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="px-5 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth" className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-6">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-40 right-[20%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            Fighting food waste, one meal at a time
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Rescue Surplus Food.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
              Feed Communities.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            FoodBridge connects surplus food from restaurants, events, and homes
            with volunteers who deliver it to people in need — all in real time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="px-8 py-4 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:-translate-y-1 w-full sm:w-auto text-center">
              Start Donating →
            </Link>
            <Link href="/auth" className="px-8 py-4 text-base font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all hover:-translate-y-1 backdrop-blur-sm w-full sm:w-auto text-center">
              Join as Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative z-10 py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Meals Rescued" },
            { value: "120+", label: "Active Volunteers" },
            { value: "50+", label: "Partner Donors" },
            { value: "0 kg", label: "Food Wasted" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3 tracking-tight">
              How FoodBridge Works
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Three simple steps from surplus to sustenance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Donors Post Food",
                desc: "Restaurants, caterers, and individuals list their surplus food with location and expiry details.",
                icon: "M12 4v16m8-8H4",
                color: "amber",
              },
              {
                step: "02",
                title: "Volunteers Claim",
                desc: "Nearby volunteers see available donations on a live map and claim them for pickup.",
                icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                color: "emerald",
              },
              {
                step: "03",
                title: "Food Gets Delivered",
                desc: "Volunteers pick up the food using a secure OTP system and deliver it to those in need.",
                icon: "M5 13l4 4L19 7",
                color: "blue",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-6`}>
                  <svg className={`w-6 h-6 text-${item.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Step {item.step}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5 relative">
        <div className="absolute top-20 right-[10%] w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-3 tracking-tight">
              Built for Impact
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Every feature is designed to make food rescue faster, safer, and easier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Live Donation Map", desc: "Volunteers see all available food donations on a real-time GPS-powered map, making pickups fast and efficient.", emoji: "🗺️" },
              { title: "Verified Handovers", desc: "Every pickup is confirmed with a unique 4-digit OTP code, ensuring food reaches the right hands.", emoji: "🔐" },
              { title: "Instant Food Posting", desc: "Donors can post surplus food in seconds — just add a title, quantity, and expiry. Location is auto-detected.", emoji: "⚡" },
              { title: "Turn-by-Turn Navigation", desc: "Volunteers get one-tap Google Maps navigation directly to the donor's exact pickup address.", emoji: "🧭" },
              { title: "Zero Food Waste Mission", desc: "Every meal rescued through FoodBridge is one less meal in a landfill and one more for someone in need.", emoji: "🌱" },
              { title: "Community Impact Tracking", desc: "See how many kilograms of food your community has rescued together, updated in real time.", emoji: "📊" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Ready to Make a
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"> Difference</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Whether you have surplus food or time to volunteer, every action counts.
            Join FoodBridge today and help end food waste in your community.
          </p>
          <Link href="/auth" className="inline-flex px-10 py-5 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:-translate-y-1">
            Join FoodBridge — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="font-bold text-lg">FoodBridge</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FoodBridge. Built with ❤️ to fight food waste.
          </p>
          <div className="flex gap-6">
            <Link href="/auth" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
            <Link href="/auth" className="text-sm text-gray-400 hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
