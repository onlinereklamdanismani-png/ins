import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().max(100).optional(),
});

const tokenSchema = z.object({ token: z.string().uuid() });

function createToken() {
  return crypto.randomUUID();
}

function getSenderEmail() {
  return process.env.RESEND_FROM ?? "InsightQuotes <onboarding@resend.dev>";
}

function getBaseUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }

  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const forwardedProto = getRequestHeader("x-forwarded-proto");
  const proto =
    forwardedProto ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

async function sendConfirmationEmail(args: {
  to: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      <h1 style="font-size:24px;margin:0 0 16px">Confirm your subscription</h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
        Welcome to <strong>InsightQuotes Weekly</strong>. Please confirm your email address to start receiving issues.
      </p>
      <p style="margin:0 0 32px">
        <a href="${args.confirmUrl}" style="display:inline-block;background:#1a2740;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:8px">
          Confirm subscription
        </a>
      </p>
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 8px">
        Or paste this link into your browser:<br>
        <span style="color:#1a2740;word-break:break-all">${args.confirmUrl}</span>
      </p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
      <p style="font-size:12px;color:#888;margin:0">
        You received this because someone (hopefully you) entered this email on our site. If not, just ignore — you won't be subscribed. You can also <a href="${args.unsubscribeUrl}" style="color:#888">unsubscribe</a>.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: getSenderEmail(),
      to: [args.to],
      subject: "Confirm your subscription to InsightQuotes Weekly",
      html,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body as { id?: string };
}

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input) => emailSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const baseUrl = getBaseUrl();
    const ip = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("id, status, confirmation_token, unsubscribe_token")
      .eq("email", data.email)
      .maybeSingle();

    let subscriber = existing;

    if (existing?.status === "active") {
      return { ok: true, alreadyActive: true };
    }

    if (!existing) {
      const { data: inserted, error } = await supabaseAdmin
        .from("subscribers")
        .insert({
          email: data.email,
          source: data.source ?? null,
          ip_address: ip,
          user_agent: userAgent,
        })
        .select("id, status, confirmation_token, unsubscribe_token")
        .single();
      if (error) throw new Error(error.message);
      subscriber = inserted;
    } else if (existing.status === "unsubscribed") {
      // Re-subscribe -> back to pending with fresh tokens
      const { data: updated, error } = await supabaseAdmin
        .from("subscribers")
        .update({
          status: "pending",
          confirmation_token: createToken(),
          unsubscribe_token: createToken(),
          unsubscribed_at: null,
          confirmed_at: null,
        })
        .eq("id", existing.id)
        .select("id, status, confirmation_token, unsubscribe_token")
        .single();
      if (error) throw new Error(error.message);
      subscriber = updated;
    }

    if (!subscriber) throw new Error("Could not create subscriber");

    const confirmUrl = `${baseUrl}/confirm/${subscriber.confirmation_token}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber.unsubscribe_token}`;

    try {
      const sent = await sendConfirmationEmail({
        to: data.email,
        confirmUrl,
        unsubscribeUrl,
      });
      await supabaseAdmin.from("email_events").insert({
        email: data.email,
        kind: "confirmation",
        status: "sent",
        provider_id: sent.id ?? null,
        subscriber_id: subscriber.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin.from("email_events").insert({
        email: data.email,
        kind: "confirmation",
        status: "failed",
        error: message,
        subscriber_id: subscriber.id,
      });
      throw new Error("Could not send confirmation email. Please try again.");
    }

    return { ok: true, alreadyActive: false };
  });

export const confirmSubscription = createServerFn({ method: "POST" })
  .inputValidator((input) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: subscriber, error } = await supabaseAdmin
      .from("subscribers")
      .select("id, status")
      .eq("confirmation_token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!subscriber) return { ok: false as const, reason: "invalid" as const };

    if (subscriber.status === "active") {
      return { ok: true as const, alreadyActive: true };
    }
    if (subscriber.status === "unsubscribed") {
      return { ok: false as const, reason: "unsubscribed" as const };
    }

    const { error: updateError } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("id", subscriber.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true as const, alreadyActive: false };
  });

export const unsubscribeFromNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: subscriber, error } = await supabaseAdmin
      .from("subscribers")
      .select("id, status")
      .eq("unsubscribe_token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!subscriber) return { ok: false as const, reason: "invalid" as const };

    if (subscriber.status === "unsubscribed") {
      return { ok: true as const, alreadyUnsubscribed: true };
    }

    const { error: updateError } = await supabaseAdmin
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true as const, alreadyUnsubscribed: false };
  });
