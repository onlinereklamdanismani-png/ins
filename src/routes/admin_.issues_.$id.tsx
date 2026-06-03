import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminIssue, updateAdminIssue } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin_/issues_/$id")({
  component: EditIssuePage,
  head: () => ({ meta: [{ title: "Edit issue | InsightQuotes admin" }] }),
});

type Issue = NonNullable<Awaited<ReturnType<typeof getAdminIssue>>>;

type State =
  | { status: "loading" }
  | { status: "ready"; issue: Issue }
  | { status: "not-found" }
  | { status: "error"; message: string };

const emptyForm = {
  issue_number: "",
  slug: "",
  title: "",
  insight: "",
  insight_author: "",
  quote: "",
  quote_author: "",
  action_text: "",
  body: "",
  status: "draft",
};

function EditIssuePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getIssueFn = useServerFn(getAdminIssue);
  const updateIssueFn = useServerFn(updateAdminIssue);
  const [state, setState] = useState<State>({ status: "loading" });
  const [form, setForm] = useState(emptyForm);
  const [submitStatus, setSubmitStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    getIssueFn({ data: { id } })
      .then((issue) => {
        if (cancelled) return;
        if (!issue) {
          setState({ status: "not-found" });
          return;
        }

        setState({ status: "ready", issue });
        setForm({
          issue_number: String(issue.issue_number),
          slug: issue.slug,
          title: issue.title,
          insight: issue.insight,
          insight_author: issue.insight_author ?? "",
          quote: issue.quote,
          quote_author: issue.quote_author ?? "",
          action_text: issue.action_text,
          body: issue.body ?? "",
          status: issue.status,
        });
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
  }, [getIssueFn, id]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitStatus.kind === "loading") return;

    setSubmitStatus({ kind: "loading" });
    try {
      await updateIssueFn({
        data: {
          id,
          issue_number: form.issue_number,
          slug: form.slug,
          title: form.title,
          insight: form.insight,
          insight_author: form.insight_author || undefined,
          quote: form.quote,
          quote_author: form.quote_author || undefined,
          action_text: form.action_text,
          body: form.body || undefined,
          status: form.status as "draft" | "published",
        },
      });
      setSubmitStatus({ kind: "success", message: "Issue updated." });
      navigate({ to: "/admin/issues" });
    } catch (error) {
      setSubmitStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not update issue.",
      });
    }
  };

  if (state.status === "loading") {
    return (
      <main className="mx-auto min-h-screen w-[min(760px,calc(100%-32px))] py-8">
        <p className="text-muted-foreground">Loading issue...</p>
      </main>
    );
  }

  if (state.status === "error" || state.status === "not-found") {
    return (
      <main className="mx-auto flex min-h-screen w-[min(520px,calc(100%-32px))] flex-col justify-center py-10">
        <section className="rounded-lg border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-bold">
            {state.status === "not-found" ? "Issue not found" : "Admin access required"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {state.status === "not-found"
              ? "This issue does not exist."
              : state.message === "Forbidden"
                ? "Your account is signed in, but it does not have the admin role."
                : "Please sign in with an admin account."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin/issues">Back to issues</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-[min(760px,calc(100%-32px))] py-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="-ml-3 gap-2">
          <Link to="/admin/issues">
            <ArrowLeft className="h-4 w-4" />
            Issues
          </Link>
        </Button>
        <h1 className="mt-6 font-serif text-4xl font-bold">Edit issue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update draft or published newsletter content.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="issue_number">No.</Label>
            <Input
              id="issue_number"
              type="number"
              min="1"
              required
              value={form.issue_number}
              onChange={(event) => updateForm("issue_number", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            required
            value={form.slug}
            onChange={(event) => updateForm("slug", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="insight_author">Insight author</Label>
            <Input
              id="insight_author"
              value={form.insight_author}
              onChange={(event) => updateForm("insight_author", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote_author">Quote author</Label>
            <Input
              id="quote_author"
              value={form.quote_author}
              onChange={(event) => updateForm("quote_author", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insight">Insight</Label>
          <Textarea
            id="insight"
            required
            rows={3}
            value={form.insight}
            onChange={(event) => updateForm("insight", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote">Quote</Label>
          <Textarea
            id="quote"
            required
            rows={3}
            value={form.quote}
            onChange={(event) => updateForm("quote", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="action_text">Action</Label>
          <Textarea
            id="action_text"
            required
            rows={3}
            value={form.action_text}
            onChange={(event) => updateForm("action_text", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            rows={6}
            value={form.body}
            onChange={(event) => updateForm("body", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(event) => updateForm("status", event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {submitStatus.kind === "success" && (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {submitStatus.message}
          </p>
        )}
        {submitStatus.kind === "error" && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitStatus.message}
          </p>
        )}

        <Button type="submit" className="w-full gap-2" disabled={submitStatus.kind === "loading"}>
          <Save className="h-4 w-4" />
          {submitStatus.kind === "loading" ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </main>
  );
}
