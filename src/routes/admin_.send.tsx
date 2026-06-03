import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getAdminSendNewsletterData, sendAdminNewsletterIssue } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin_/send")({
  component: AdminSendPage,
  head: () => ({ meta: [{ title: "Send newsletter | InsightQuotes admin" }] }),
});

type SendData = Awaited<ReturnType<typeof getAdminSendNewsletterData>>;

type State =
  | { status: "loading" }
  | { status: "ready"; data: SendData }
  | { status: "error"; message: string };

function formatDate(value: string | null) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function AdminSendPage() {
  const getSendDataFn = useServerFn(getAdminSendNewsletterData);
  const sendIssueFn = useServerFn(sendAdminNewsletterIssue);
  const [state, setState] = useState<State>({ status: "loading" });
  const [issueId, setIssueId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [resendToEveryone, setResendToEveryone] = useState(false);
  const [sendStatus, setSendStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    getSendDataFn()
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data });
        setIssueId(data.issues[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load send data.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [getSendDataFn]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!issueId || !confirmed || sendStatus.kind === "loading") return;

    setSendStatus({ kind: "loading" });
    try {
      const result = await sendIssueFn({ data: { issueId, resendToEveryone } });
      setSendStatus({
        kind: "success",
        message: `Done. Sent: ${result.sent}, failed: ${result.failed}, skipped: ${result.skipped}, total attempted: ${result.total}.`,
      });
      setConfirmed(false);
    } catch (error) {
      setSendStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not send newsletter.",
      });
    }
  };

  if (state.status === "loading") {
    return (
      <main className="mx-auto min-h-screen w-[min(720px,calc(100%-32px))] py-8">
        <p className="text-muted-foreground">Loading send screen...</p>
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

  const selectedIssue = state.data.issues.find((issue) => issue.id === issueId);
  const canSend = Boolean(issueId && confirmed && state.data.activeSubscriberCount > 0);

  return (
    <main className="mx-auto min-h-screen w-[min(760px,calc(100%-32px))] py-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="-ml-3 gap-2">
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <h1 className="mt-6 font-serif text-4xl font-bold">Send newsletter</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Send one published issue to every active subscriber.
        </p>
      </header>

      <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-soft text-navy">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">Delivery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Active subscribers: {state.data.activeSubscriberCount}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue">Published issue</Label>
          <select
            id="issue"
            value={issueId}
            onChange={(event) => {
              setIssueId(event.target.value);
              setConfirmed(false);
              setResendToEveryone(false);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {state.data.issues.length === 0 ? (
              <option value="">No published issues</option>
            ) : (
              state.data.issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  #{issue.issue_number} - {issue.title}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedIssue && (
          <div className="mt-5 rounded-md border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">
              Issue #{selectedIssue.issue_number} • {formatDate(selectedIssue.published_at)}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-bold">{selectedIssue.title}</h3>
          </div>
        )}

        <label className="mt-6 flex items-start gap-3 rounded-md border border-border bg-background p-4">
          <Checkbox
            checked={resendToEveryone}
            onCheckedChange={(value) => {
              setResendToEveryone(value === true);
              setConfirmed(false);
            }}
            disabled={!issueId || state.data.activeSubscriberCount === 0}
          />
          <span className="text-sm leading-6">
            Resend this issue to everyone, including subscribers who already received it.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-3 rounded-md border border-border bg-background p-4">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            disabled={!issueId || state.data.activeSubscriberCount === 0}
          />
          <span className="text-sm leading-6">
            I understand this will send the selected issue{" "}
            {resendToEveryone
              ? "again to every active subscriber."
              : "only to active subscribers who have not received it yet."}
          </span>
        </label>

        {sendStatus.kind === "success" && (
          <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {sendStatus.message}
          </p>
        )}
        {sendStatus.kind === "error" && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {sendStatus.message}
          </p>
        )}

        <Button
          type="submit"
          className="mt-6 w-full gap-2"
          disabled={!canSend || sendStatus.kind === "loading"}
        >
          <Send className="h-4 w-4" />
          {sendStatus.kind === "loading" ? "Sending..." : "Send to active subscribers"}
        </Button>
      </form>
    </main>
  );
}
