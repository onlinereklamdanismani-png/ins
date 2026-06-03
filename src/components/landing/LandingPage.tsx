import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeToNewsletter } from "@/lib/newsletter.functions";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "/archive", label: "Archive" },
  { href: "#topics", label: "Topics" },
  { href: "#business", label: "For Business" },
  { href: "/admin/login", label: "Log in" },
];

function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  const big = size === "md" ? "text-[34px]" : "text-[28px]";
  const offset = size === "md" ? "ml-[95px]" : "ml-[74px]";
  return (
    <a href="#" className="font-serif font-extrabold leading-[0.9] tracking-[-1.2px]">
      <span className={big}>insightquotes</span>
      <span className={`block font-sans text-[11px] tracking-[5px] text-gold mt-1 ${offset}`}>
        WEEKLY
      </span>
    </a>
  );
}

function SignupForm({ dark = false }: { dark?: boolean }) {
  const subscribe = useServerFn(subscribeToNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status.kind === "loading") return;
    setStatus({ kind: "loading" });
    try {
      const res = await subscribe({ data: { email, source: "landing" } });
      setStatus({
        kind: "success",
        message: res.alreadyActive
          ? "You're already subscribed ✓"
          : "Check your inbox to confirm ✉",
      });
      setEmail("");
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  };

  const placeholder = status.kind === "success" ? status.message : "Your email address";

  return (
    <div className={dark ? "mx-auto max-w-[425px]" : "max-w-[425px]"}>
      <form
        onSubmit={onSubmit}
        className={`flex rounded-lg overflow-hidden border ${
          dark ? "border-white/30 bg-transparent" : "border-border bg-white"
        } max-[560px]:flex-col`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={status.kind === "loading"}
          className={`flex-1 border-0 px-[18px] py-4 text-[15px] outline-none bg-transparent ${
            dark ? "text-white placeholder:text-[#b7c0ca]" : "text-ink"
          } max-[560px]:p-4`}
        />
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="font-bold text-white px-6 py-[14px] rounded-none cursor-pointer max-[560px]:w-full disabled:opacity-70"
          style={{ background: "var(--gradient-gold)" }}
        >
          {status.kind === "loading" ? "Sending…" : "Join Free"}
        </button>
      </form>
      {status.kind === "error" && (
        <p className={`mt-2 text-sm ${dark ? "text-[#ffcccc]" : "text-destructive"}`}>
          {status.message}
        </p>
      )}
      {status.kind === "success" && (
        <p className={`mt-2 text-sm ${dark ? "text-[#d5dce4]" : "text-muted-foreground"}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}

function Avatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-[30px] h-[30px] rounded-full border-2 border-card -ml-2 first:ml-0 ${className}`}
      style={{ background: "linear-gradient(135deg, #d8b48c, #394b5f)" }}
    />
  );
}

function NewsletterPreview() {
  return (
    <div className="relative">
      <div className="absolute w-[520px] h-[520px] rounded-full bg-navy -right-[110px] top-1/2 -translate-y-1/2 z-0 max-[900px]:right-1/2 max-[900px]:translate-x-1/2 max-[900px]:-translate-y-1/2 max-[900px]:w-[420px] max-[900px]:h-[420px]">
        <span
          className="absolute -inset-6 rounded-full"
          style={{ border: "18px solid oklch(0.7 0.13 75 / 0.23)" }}
        />
      </div>
      <article
        className="relative z-10 rounded-[14px] p-[34px_38px] max-w-[470px] ml-auto border border-border max-[900px]:mx-auto max-[560px]:p-[26px_22px]"
        style={{
          background: "rgba(255,253,249,0.96)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex justify-between gap-6 mb-9">
          <div className="font-serif font-extrabold text-[30px] leading-[0.9]">
            insightquotes
            <span className="block font-sans text-gold text-[10px] tracking-[4px] text-right mt-1">
              WEEKLY
            </span>
          </div>
          <div className="text-[13px] text-right leading-[1.7]">
            Issue #128
            <br />
            May 19, 2026
          </div>
        </div>

        {[
          {
            icon: "💡",
            label: "The Insight",
            text: "The cost of inaction is usually far greater than the cost of a mistake.",
            cite: "— Tim Ferriss",
          },
          {
            icon: "“",
            label: "The Quote",
            text: "“The question you should be asking is, what's the worst that can happen?”",
            cite: "— Tim Ferriss",
          },
          {
            icon: "☑",
            label: "The Action",
            text: "What's one bold move you've been avoiding? Do it this week.",
            cite: "",
          },
        ].map((item, i) => (
          <div
            key={item.label}
            className={`grid grid-cols-[56px_1fr] gap-5 py-[26px] max-[560px]:grid-cols-[46px_1fr] max-[560px]:gap-[14px] ${
              i === 0 ? "pt-0" : "border-t border-border"
            }`}
          >
            <div className="w-14 h-14 rounded-full grid place-items-center bg-soft text-gold text-[26px] max-[560px]:w-[46px] max-[560px]:h-[46px] max-[560px]:text-[22px]">
              {item.icon}
            </div>
            <div>
              <h3 className="text-[12px] tracking-[2px] uppercase font-semibold m-0 mb-2.5">
                {item.label}
              </h3>
              <p className="m-0 font-serif text-[20px] leading-[1.35]">{item.text}</p>
              {item.cite && (
                <small className="block mt-2.5 text-muted-foreground">{item.cite}</small>
              )}
            </div>
          </div>
        ))}

        <button className="w-full mt-[18px] rounded-md py-[14px] px-6 bg-navy text-white font-bold cursor-pointer">
          Read This Week's Issue →
        </button>
      </article>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📖",
    title: "Curated Insights",
    body: "The best ideas from 100+ books, podcasts, and interviews.",
  },
  {
    icon: "❞",
    title: "Powerful Quotes",
    body: "Handpicked quotes that challenge your thinking and inspire action.",
  },
  {
    icon: "🎯",
    title: "Actionable Steps",
    body: "One simple action you can take to apply the insight immediately.",
  },
  {
    icon: "◷",
    title: "5-Minute Read",
    body: "Concise, clear, and valuable — designed for busy curious minds.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "InsightQuotes is the first email I open every week. It's short, insightful, and impactful.",
    name: "Alex H.",
    role: "Entrepreneur",
  },
  {
    quote: "I've learned more in 5 minutes from InsightQuotes than in hours of scrolling.",
    name: "Sophie M.",
    role: "Product Manager",
  },
  {
    quote: "Finally, a newsletter that respects my time and feeds my mind.",
    name: "David L.",
    role: "Investor",
  },
];

export function LandingPage() {
  return (
    <main
      className="mx-auto my-[18px] w-[min(1180px,calc(100%-32px))] overflow-hidden rounded-[22px] border border-border max-[560px]:my-2 max-[560px]:w-[calc(100%-16px)] max-[560px]:rounded-2xl"
      style={{
        background: "rgba(255,250,243,0.92)",
        boxShadow: "var(--shadow-page)",
      }}
    >
      <div className="mx-auto w-[min(1020px,calc(100%-36px))]">
        {/* Header */}
        <header className="flex items-center justify-between py-7 max-[560px]:py-[22px]">
          <Logo />
          <nav className="flex items-center gap-[34px] text-[15px] font-medium">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="max-[900px]:hidden hover:text-gold-dark transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a href="#join" className="rounded-md bg-navy px-6 py-[14px] font-bold text-white">
              Join Free
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="grid grid-cols-2 gap-[70px] items-center pt-[52px] pb-[72px] max-[900px]:grid-cols-1 max-[900px]:gap-11 max-[900px]:pt-[34px]">
          <div>
            <div className="text-gold-dark text-[13px] tracking-[5px] font-extrabold uppercase mb-[22px]">
              Wisdom. Insights. Action.
            </div>
            <h1 className="font-serif m-0 mb-7 leading-[0.92] tracking-[-3px] text-[clamp(56px,7vw,86px)] max-[560px]:tracking-[-2px]">
              One idea.
              <br />
              One quote.
              <br />
              One action.
            </h1>
            <p className="text-[19px] leading-[1.65] text-[#333d48] max-w-[480px] mb-[30px]">
              A free weekly newsletter with the most powerful ideas from books, podcasts, and
              thinkers — curated and distilled into 5-minute reads.
            </p>
            <SignupForm />
            <div className="flex items-center gap-[14px] mt-[26px] text-muted-foreground text-sm">
              <div className="flex">
                <Avatar />
                <Avatar />
                <Avatar />
                <Avatar />
              </div>
              <span>Join 25,000+ curious minds</span>
            </div>
          </div>
          <NewsletterPreview />
        </section>

        {/* What you get */}
        <section className="border-t border-border pt-9 pb-16 text-center" id="about">
          <div className="text-gold-dark text-[13px] tracking-[5px] font-extrabold uppercase">
            What You Get
          </div>
          <h2 className="font-serif text-[clamp(32px,4vw,44px)] leading-[1.1] my-3 mb-[42px] mx-auto max-w-[680px]">
            Timeless wisdom. Practical takeaways. Every single week.
          </h2>
          <div className="grid grid-cols-4 gap-8 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="w-16 h-16 mx-auto mb-[18px] grid place-items-center rounded-full bg-soft text-[28px]">
                  {f.icon}
                </div>
                <h3 className="font-serif text-[21px] m-0 mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-[15px] leading-[1.6] m-0">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-border pt-9 pb-16 text-center">
          <div className="text-gold-dark text-[13px] tracking-[5px] font-extrabold uppercase mb-[42px]">
            Loved By Readers
          </div>
          <div className="grid grid-cols-3 gap-6 text-left max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="border border-border rounded-[14px] p-6"
                style={{ background: "rgba(255,255,255,0.52)" }}
              >
                <div className="text-gold tracking-[2px] mb-4">★★★★★</div>
                <blockquote className="m-0 mb-5 font-serif text-[19px] leading-[1.45]">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                  <Avatar />
                  <div>
                    <strong className="block text-ink text-sm">{t.name}</strong>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-around gap-6 flex-wrap pt-9 text-[#a6a09a] font-extrabold text-[21px] max-[560px]:text-[17px]">
            <span>FOUNDER</span>
            <span>INDIE HACKERS</span>
            <span>Product Hunt</span>
            <span>Medium</span>
            <span>LinkedIn</span>
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <section
        className="text-white text-center px-5 pt-[58px] pb-[34px]"
        style={{ background: "var(--gradient-cta)" }}
      >
        <div className="w-[46px] h-[46px] mx-auto mb-[18px] grid place-items-center rounded-full text-gold text-[22px] border border-gold">
          ✉
        </div>
        <h2 className="font-serif text-[clamp(30px,4vw,44px)] m-0 mb-3">
          Join 25,000+ readers leveling up their thinking.
        </h2>
        <p className="text-[#d5dce4] mb-[22px]">New insights every Sunday. Unsubscribe anytime.</p>
        <SignupForm dark />
        <div className="mt-[18px] text-[#c7d0d9] text-[13px]">No spam. Ever.</div>
      </section>
    </main>
  );
}
