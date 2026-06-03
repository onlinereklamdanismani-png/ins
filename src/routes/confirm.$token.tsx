import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { confirmSubscription } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/confirm/$token")({
  component: ConfirmPage,
  head: () => ({ meta: [{ title: "Confirm subscription" }] }),
});

type State =
  | { status: "loading" }
  | { status: "success"; alreadyActive: boolean }
  | { status: "error"; message: string };

function ConfirmPage() {
  const { token } = Route.useParams();
  const confirmFn = useServerFn(confirmSubscription);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    confirmFn({ data: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setState({ status: "success", alreadyActive: res.alreadyActive });
        } else {
          setState({
            status: "error",
            message:
              res.reason === "unsubscribed"
                ? "This subscription was cancelled. Please sign up again."
                : "This confirmation link is invalid or has expired.",
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token, confirmFn]);

  return (
    <main className="mx-auto my-12 max-w-[520px] px-6 text-center">
      <div className="rounded-[14px] border border-border bg-card p-10 shadow-sm">
        {state.status === "loading" && (
          <p className="text-muted-foreground">Confirming your subscription…</p>
        )}
        {state.status === "success" && (
          <>
            <div className="text-4xl mb-3">✓</div>
            <h1 className="font-serif text-2xl mb-2">
              {state.alreadyActive ? "Already confirmed" : "You're in!"}
            </h1>
            <p className="text-muted-foreground">
              Thanks for subscribing to InsightQuotes Weekly. The next issue lands in your inbox on
              Sunday.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-md bg-navy px-6 py-3 font-bold text-white"
            >
              Back to home
            </a>
          </>
        )}
        {state.status === "error" && (
          <>
            <h1 className="font-serif text-2xl mb-2">Confirmation failed</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <a
              href="/"
              className="mt-6 inline-block rounded-md bg-navy px-6 py-3 font-bold text-white"
            >
              Back to home
            </a>
          </>
        )}
      </div>
    </main>
  );
}
