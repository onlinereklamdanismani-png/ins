import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listPublishedIssues } from "@/lib/issues.functions";

export const Route = createFileRoute("/archive")({
  component: ArchivePage,
  head: () => ({
    meta: [
      { title: "Archive | InsightQuotes Weekly" },
      {
        name: "description",
        content: "Read published issues of InsightQuotes Weekly.",
      },
    ],
  }),
});

type PublishedIssue = Awaited<ReturnType<typeof listPublishedIssues>>[number];

type State =
  | { status: "loading" }
  | { status: "ready"; issues: PublishedIssue[] }
  | { status: "error"; message: string };

function formatDate(value: string | null) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function ArchivePage() {
  const listIssuesFn = useServerFn(listPublishedIssues);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    listIssuesFn()
      .then((issues) => {
        if (!cancelled) setState({ status: "ready", issues });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load archive.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [listIssuesFn]);

  return (
    <main className="mx-auto min-h-screen w-[min(920px,calc(100%-32px))] py-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="-ml-3 gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </Button>
        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-soft text-navy">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-bold">Archive</h1>
            <p className="mt-1 text-muted-foreground">Published InsightQuotes Weekly issues.</p>
          </div>
        </div>
      </header>

      {state.status === "loading" && (
        <p className="rounded-lg border border-border bg-card p-5 text-muted-foreground shadow-sm">
          Loading archive...
        </p>
      )}

      {state.status === "error" && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <section className="space-y-4">
          {state.issues.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-5 text-muted-foreground shadow-sm">
              No published issues yet.
            </p>
          ) : (
            state.issues.map((issue) => (
              <Link
                key={issue.id}
                to="/issues/$slug"
                params={{ slug: issue.slug }}
                className="block rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-gold"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>Issue #{issue.issue_number}</span>
                  <span>{formatDate(issue.published_at)}</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-ink">{issue.title}</h2>
                <p className="mt-3 line-clamp-2 text-muted-foreground">{issue.insight}</p>
              </Link>
            ))
          )}
        </section>
      )}
    </main>
  );
}
