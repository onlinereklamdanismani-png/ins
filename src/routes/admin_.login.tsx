import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin_/login")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "Admin login | InsightQuotes" }] }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status.kind === "loading") return;

    setStatus({ kind: "loading" });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }

    navigate({ to: "/admin" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-[min(440px,calc(100%-32px))] flex-col justify-center py-12">
      <Link to="/" className="mb-8 font-serif text-3xl font-extrabold leading-none text-ink">
        insightquotes
        <span className="block font-sans text-[11px] font-bold tracking-[5px] text-gold">
          WEEKLY
        </span>
      </Link>

      <section className="rounded-lg border border-border bg-card p-7 shadow-sm">
        <div className="mb-7">
          <h1 className="font-serif text-3xl font-bold">Admin login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an account that has the admin role.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {status.kind === "error" && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {status.message}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={status.kind === "loading"}>
            <LogIn className="h-4 w-4" />
            {status.kind === "loading" ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
