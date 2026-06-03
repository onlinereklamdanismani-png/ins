import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { FilePlus, LogOut, Mail, Newspaper, Send, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminDashboard } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardPage,
  head: () => ({ meta: [{ title: "Admin dashboard | InsightQuotes" }] }),
});

type DashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;

type State =
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "error"; message: string };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-soft text-navy">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getAdminDashboard);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    dashboardFn()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load admin dashboard.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [dashboardFn]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (state.status === "loading") {
    return (
      <main className="mx-auto min-h-screen w-[min(1120px,calc(100%-32px))] py-10">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex min-h-screen w-[min(520px,calc(100%-32px))] flex-col justify-center py-10">
        <section className="rounded-lg border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-bold">Admin access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {state.message === "Forbidden"
              ? "Your account is signed in, but it does not have the admin role."
              : "Please sign in with an admin account."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin/login">Go to login</Link>
          </Button>
        </section>
      </main>
    );
  }

  const { data } = state;

  return (
    <main className="mx-auto min-h-screen w-[min(1120px,calc(100%-32px))] py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="font-serif text-3xl font-extrabold leading-none text-ink">
            insightquotes
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {data.user.email || "admin"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2">
            <Link to="/admin/issues">
              <FilePlus className="h-4 w-4" />
              Manage issues
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/subscribers">
              <UserRound className="h-4 w-4" />
              Subscribers
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/send">
              <Send className="h-4 w-4" />
              Send newsletter
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total subscribers" value={data.counts.total} icon={Users} />
        <StatCard label="Active" value={data.counts.active} icon={Mail} />
        <StatCard label="Pending" value={data.counts.pending} icon={Send} />
        <StatCard label="Unsubscribed" value={data.counts.unsubscribed} icon={LogOut} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold">Latest issues</h2>
              <p className="text-sm text-muted-foreground">Newest draft and published issues.</p>
            </div>
            <Newspaper className="h-5 w-5 text-gold-dark" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.latestIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No issues yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.latestIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>#{issue.issue_number}</TableCell>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell className="capitalize">{issue.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold">Email events</h2>
              <p className="text-sm text-muted-foreground">Recent confirmation send attempts.</p>
            </div>
            <Mail className="h-5 w-5 text-gold-dark" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.latestEmailEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No email events yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.latestEmailEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-[210px] truncate">{event.email}</TableCell>
                    <TableCell className="capitalize">{event.kind}</TableCell>
                    <TableCell className="capitalize">{event.status}</TableCell>
                    <TableCell>{formatDate(event.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  );
}
