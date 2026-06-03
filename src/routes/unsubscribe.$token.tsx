import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { unsubscribeFromNewsletter } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/unsubscribe/$token")({
  component: UnsubscribePage,
  head: () => ({ meta: [{ title: "Unsubscribe" }] }),
});

type State =
  | { status: "loading" }
  | { status: "success"; alreadyUnsubscribed: boolean }
  | { status: "error"; message: string };

function UnsubscribePage() {
  const { token } = Route.useParams();
  const unsubFn = useServerFn(unsubscribeFromNewsletter);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    unsubFn({ data: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setState({
            status: "success",
            alreadyUnsubscribed: res.alreadyUnsubscribed,
          });
        } else {
          setState({
            status: "error",
            message: "This unsubscribe link is invalid.",
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
  }, [token, unsubFn]);

  return (
    <main className="mx-auto my-12 max-w-[520px] px-6 text-center">
      <div className="rounded-[14px] border border-border bg-card p-10 shadow-sm">
        {state.status === "loading" && (
          <p className="text-muted-foreground">Updating your preferences…</p>
        )}
        {state.status === "success" && (
          <>
            <h1 className="font-serif text-2xl mb-2">
              {state.alreadyUnsubscribed ? "Already unsubscribed" : "You're unsubscribed"}
            </h1>
            <p className="text-muted-foreground">
              You won't receive any more emails from InsightQuotes Weekly. Changed your mind? You
              can sign up again anytime.
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
            <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
            <p className="text-muted-foreground">{state.message}</p>
          </>
        )}
      </div>
    </main>
  );
}
