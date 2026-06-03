import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminSubscribers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin_/subscribers")({
  component: AdminSubscribersPage,
  head: () => ({ meta: [{ title: "Subscribers | InsightQuotes admin" }] }),
});

type Subscriber = Awaited<ReturnType<typeof listAdminSubscribers>>[number];
type SubscriberFilter = "all" | "pending" | "active" | "unsubscribed" | "bounced" | "complained";

type State =
  | { status: "loading" }
  | { status: "ready"; subscribers: Subscriber[] }
  | { status: "error"; message: string };

const FILTERS: SubscriberFilter[] = [
  "all",
  "active",
  "pending",
  "unsubscribed",
  "bounced",
  "complained",
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminSubscribersPage() {
  const listSubscribersFn = useServerFn(listAdminSubscribers);
  const [filter, setFilter] = useState<SubscriberFilter>("all");
  const [state, setState] = useState<State>({ status: "loading" });

  const loadSubscribers = async (status: SubscriberFilter = filter) => {
    setState({ status: "loading" });
    try {
      const subscribers = await listSubscribersFn({ data: { status } });
      setState({ status: "ready", subscribers });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not load subscribers.",
      });
    }
  };

  useEffect(() => {
    loadSubscribers(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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

  return (
    <main className="mx-auto min-h-screen w-[min(1120px,calc(100%-32px))] py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="mt-2 font-serif text-4xl font-bold">Subscribers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review recent newsletter subscribers and their opt-in status.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => loadSubscribers()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-soft text-navy">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold">Subscriber list</h2>
              <p className="text-sm text-muted-foreground">Showing the latest 100 records.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={filter === item ? "default" : "outline"}
                className="capitalize"
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead>Unsubscribed</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.status === "loading" ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading subscribers...
                </TableCell>
              </TableRow>
            ) : state.subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No subscribers found.
                </TableCell>
              </TableRow>
            ) : (
              state.subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell className="capitalize">{subscriber.status}</TableCell>
                  <TableCell>{subscriber.source || "-"}</TableCell>
                  <TableCell>{formatDate(subscriber.confirmed_at)}</TableCell>
                  <TableCell>{formatDate(subscriber.unsubscribed_at)}</TableCell>
                  <TableCell>{formatDate(subscriber.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
