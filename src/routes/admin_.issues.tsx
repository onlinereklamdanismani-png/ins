import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, FilePlus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createAdminIssue, listAdminIssues } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin_/issues")({
  component: AdminIssuesPage,
  head: () => ({ meta: [{ title: "Issues | InsightQuotes admin" }] }),
});

type IssueListItem = Awaited<ReturnType<typeof listAdminIssues>>[number];

type State =
  | { status: "loading" }
  | { status: "ready"; issues: IssueListItem[] }
  | { status: "error"; message: string };

const initialForm = {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function AdminIssuesPage() {
  const listIssuesFn = useServerFn(listAdminIssues);
  const createIssueFn = useServerFn(createAdminIssue);
  const [state, setState] = useState<State>({ status: "loading" });
  const [form, setForm] = useState(initialForm);
  const [submitStatus, setSubmitStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const nextIssueNumber = useMemo(() => {
    if (state.status !== "ready" || state.issues.length === 0) return "";
    return String(Math.max(...state.issues.map((issue) => issue.issue_number)) + 1);
  }, [state]);

  const loadIssues = async () => {
    setState({ status: "loading" });
    try {
      const issues = await listIssuesFn();
      setState({ status: "ready", issues });
      const nextNumber =
        issues.length > 0 ? String(Math.max(...issues.map((issue) => issue.issue_number)) + 1) : "";
      setForm((current) => ({
        ...current,
        issue_number: current.issue_number || nextNumber,
      }));
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not load issues.",
      });
    }
  };

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitStatus.kind === "loading") return;

    setSubmitStatus({ kind: "loading" });
    try {
      await createIssueFn({
        data: {
          issue_number: form.issue_number,
          slug: form.slug || slugify(form.title),
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
      setSubmitStatus({ kind: "success", message: "Issue saved." });
      setForm(initialForm);
      await loadIssues();
    } catch (error) {
      setSubmitStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not save issue.",
      });
    }
  };

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
    <main className="mx-auto min-h-screen w-[min(1180px,calc(100%-32px))] py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="mt-2 font-serif text-4xl font-bold">Issues</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and publish InsightQuotes newsletter issues.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={loadIssues}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-soft text-navy">
              <FilePlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold">New issue</h2>
              <p className="text-sm text-muted-foreground">Save as draft or publish immediately.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="issue_number">No.</Label>
                <Input
                  id="issue_number"
                  type="number"
                  min="1"
                  required
                  value={form.issue_number}
                  placeholder={nextIssueNumber}
                  onChange={(event) => updateForm("issue_number", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onBlur={() => {
                    if (!form.slug && form.title) updateForm("slug", slugify(form.title));
                  }}
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
                placeholder="issue-129-title"
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
                rows={5}
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

            <Button type="submit" className="w-full" disabled={submitStatus.kind === "loading"}>
              {submitStatus.kind === "loading" ? "Saving..." : "Save issue"}
            </Button>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-bold">All issues</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Draft and published issues.</p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.status === "loading" ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading issues...
                  </TableCell>
                </TableRow>
              ) : state.issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No issues yet.
                  </TableCell>
                </TableRow>
              ) : (
                state.issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>#{issue.issue_number}</TableCell>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell className="capitalize">{issue.status}</TableCell>
                    <TableCell>{formatDate(issue.published_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/issues/$id" params={{ id: issue.id }}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
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
