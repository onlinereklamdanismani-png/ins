import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Lightbulb, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublishedIssue } from "@/lib/issues.functions";

export const Route = createFileRoute("/issues/$slug")({
  component: IssueDetailPage,
});

type PublishedIssue = NonNullable<Awaited<ReturnType<typeof getPublishedIssue>>>;

type State =
  | { status: "loading" }
  | { status: "ready"; issue: PublishedIssue }
  | { status: "not-found" }
  | { status: "error"; message: string };

function formatDate(value: string | null) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function IssueBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Lightbulb;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-border py-7 sm:grid-cols-[56px_1fr]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft text-gold-dark">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[3px] text-gold-dark">{label}</h2>
        {children}
      </div>
    </section>
  );
}

function IssueDetailPage() {
  const { slug } = Route.useParams();
  const getIssueFn = useServerFn(getPublishedIssue);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getIssueFn({ data: { slug } })
      .then((issue) => {
        if (cancelled) return;
        setState(issue ? { status: "ready", issue } : { status: "not-found" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load issue.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [getIssueFn, slug]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto min-h-screen w-[min(780px,calc(100%-32px))] py-8">
        <p className="text-muted-foreground">Loading issue...</p>
      </main>
    );
  }

  if (state.status === "error" || state.status === "not-found") {
    return (
      <main className="mx-auto flex min-h-screen w-[min(520px,calc(100%-32px))] flex-col justify-center py-10">
        <section className="rounded-lg border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-bold">
            {state.status === "not-found" ? "Issue not found" : "Issue did not load"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {state.status === "not-found"
              ? "This issue is not published or does not exist."
              : state.message}
          </p>
          <Button asChild className="mt-6">
            <Link to="/archive">Back to archive</Link>
          </Button>
        </section>
      </main>
    );
  }

  const { issue } = state;

  return (
    <main className="mx-auto min-h-screen w-[min(780px,calc(100%-32px))] py-8">
      <Button asChild variant="ghost" className="-ml-3 gap-2">
        <Link to="/archive">
          <ArrowLeft className="h-4 w-4" />
          Archive
        </Link>
      </Button>

      <article className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-9">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Issue #{issue.issue_number}</span>
            <span>{formatDate(issue.published_at)}</span>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">{issue.title}</h1>
        </header>

        <IssueBlock icon={Lightbulb} label="The Insight">
          <p className="font-serif text-2xl leading-snug">{issue.insight}</p>
          {issue.insight_author && (
            <p className="mt-3 text-sm text-muted-foreground">{issue.insight_author}</p>
          )}
        </IssueBlock>

        <IssueBlock icon={Quote} label="The Quote">
          <blockquote className="font-serif text-2xl leading-snug">"{issue.quote}"</blockquote>
          {issue.quote_author && (
            <p className="mt-3 text-sm text-muted-foreground">{issue.quote_author}</p>
          )}
        </IssueBlock>

        <IssueBlock icon={CheckCircle2} label="The Action">
          <p className="font-serif text-2xl leading-snug">{issue.action_text}</p>
        </IssueBlock>

        {issue.body && (
          <section className="border-t border-border pt-7">
            <div className="whitespace-pre-wrap text-[17px] leading-8 text-[#333d48]">
              {issue.body}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
