import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

type SubscriberStatus = Database["public"]["Enums"]["subscriber_status"];

const issueSchema = z.object({
  issue_number: z.coerce.number().int().positive(),
  slug: z.string().trim().min(1).max(140),
  title: z.string().trim().min(1).max(200),
  insight: z.string().trim().min(1),
  insight_author: z.string().trim().max(120).optional(),
  quote: z.string().trim().min(1),
  quote_author: z.string().trim().max(120).optional(),
  action_text: z.string().trim().min(1),
  body: z.string().trim().optional(),
  status: z.enum(["draft", "published"]),
});

const subscriberListSchema = z.object({
  status: z
    .enum(["all", "pending", "active", "unsubscribed", "bounced", "complained"])
    .default("all"),
});

const sendIssueSchema = z.object({
  issueId: z.string().uuid(),
  resendToEveryone: z.coerce.boolean().default(false),
});

const issueIdSchema = z.object({
  id: z.string().uuid(),
});

const updateIssueSchema = issueSchema.extend({
  id: z.string().uuid(),
});

function getBearerToken() {
  const authHeader = getRequestHeader("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  return authHeader.replace("Bearer ", "");
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

function getSenderEmail() {
  return process.env.RESEND_FROM ?? "Mira from InsightQuotes <hello@insightquotes.com>";
}

function getReplyToEmail() {
  return process.env.RESEND_REPLY_TO ?? "hello@insightquotes.com";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderParagraphs(value: string | null) {
  if (!value) return "";
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map(
      (paragraph) => `<p style="font-size:16px;line-height:1.7;margin:0 0 18px">${paragraph}</p>`,
    )
    .join("");
}

async function sendIssueEmail(args: {
  to: string;
  issue: {
    issue_number: number;
    title: string;
    insight: string;
    insight_author: string | null;
    quote: string;
    quote_author: string | null;
    action_text: string;
    body: string | null;
  };
  unsubscribeUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px">InsightQuotes Weekly #${args.issue.issue_number}</p>
      <h1 style="font-size:26px;line-height:1.25;margin:0 0 24px">${escapeHtml(args.issue.title)}</h1>

      <div style="margin:0 0 24px">
        <p style="font-size:13px;color:#777;margin:0 0 8px">The Insight</p>
        <p style="font-size:19px;line-height:1.5;margin:0">${escapeHtml(args.issue.insight)}</p>
        ${
          args.issue.insight_author
            ? `<p style="font-size:14px;color:#666;margin:8px 0 0">${escapeHtml(args.issue.insight_author)}</p>`
            : ""
        }
      </div>

      <div style="margin:0 0 24px">
        <p style="font-size:13px;color:#777;margin:0 0 8px">The Quote</p>
        <p style="font-size:19px;line-height:1.5;margin:0">&ldquo;${escapeHtml(args.issue.quote)}&rdquo;</p>
        ${
          args.issue.quote_author
            ? `<p style="font-size:14px;color:#666;margin:8px 0 0">${escapeHtml(args.issue.quote_author)}</p>`
            : ""
        }
      </div>

      <div style="margin:0 0 24px">
        <p style="font-size:13px;color:#777;margin:0 0 8px">The Action</p>
        <p style="font-size:19px;line-height:1.5;margin:0">${escapeHtml(args.issue.action_text)}</p>
      </div>

      ${
        args.issue.body
          ? `<div style="margin:0 0 24px">${renderParagraphs(args.issue.body)}</div>`
          : ""
      }

      <p style="font-size:16px;line-height:1.7;margin:0 0 24px">
        If this was useful, reply and tell me what stood out. Short replies help keep these emails in your main inbox.
      </p>
      <p style="font-size:12px;color:#777;line-height:1.6;margin:0">
        You are receiving this because you subscribed to InsightQuotes Weekly.
        <a href="${args.unsubscribeUrl}" style="color:#777">Unsubscribe</a>.
        <br>Unit 117011, PO Box 15113, Birmingham, B2 2NJ
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
      reply_to: getReplyToEmail(),
      subject: `InsightQuotes Weekly #${args.issue.issue_number}: ${args.issue.title}`,
      html,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body as { id?: string };
}

async function requireAdmin() {
  const token = getBearerToken();
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const authClient = createClient<Database>(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.getUser(token);
  const user = data.user;
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);
  if (!role) throw new Error("Forbidden");

  return { user, supabaseAdmin };
}

async function countSubscribersByStatus(status: SubscriberStatus) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { user, supabaseAdmin } = await requireAdmin();

  const [
    totalSubscribers,
    activeSubscribers,
    pendingSubscribers,
    unsubscribedSubscribers,
    latestIssues,
    latestEmailEvents,
  ] = await Promise.all([
    supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
    countSubscribersByStatus("active"),
    countSubscribersByStatus("pending"),
    countSubscribersByStatus("unsubscribed"),
    supabaseAdmin
      .from("issues")
      .select("id, issue_number, title, slug, status, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("email_events")
      .select("id, email, kind, status, created_at, error")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (totalSubscribers.error) throw new Error(totalSubscribers.error.message);
  if (latestIssues.error) throw new Error(latestIssues.error.message);
  if (latestEmailEvents.error) throw new Error(latestEmailEvents.error.message);

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
    },
    counts: {
      total: totalSubscribers.count ?? 0,
      active: activeSubscribers,
      pending: pendingSubscribers,
      unsubscribed: unsubscribedSubscribers,
    },
    latestIssues: latestIssues.data ?? [],
    latestEmailEvents: latestEmailEvents.data ?? [],
  };
});

export const listAdminIssues = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("issues")
    .select("id, issue_number, slug, title, status, published_at, created_at")
    .order("issue_number", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createAdminIssue = createServerFn({ method: "POST" })
  .inputValidator((input) => issueSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin();

    const { data: issue, error } = await supabaseAdmin
      .from("issues")
      .insert({
        issue_number: data.issue_number,
        slug: data.slug,
        title: data.title,
        insight: data.insight,
        insight_author: data.insight_author || null,
        quote: data.quote,
        quote_author: data.quote_author || null,
        action_text: data.action_text,
        body: data.body || null,
        status: data.status,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, id: issue.id };
  });

export const getAdminIssue = createServerFn({ method: "GET" })
  .inputValidator((input) => issueIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin();

    const { data: issue, error } = await supabaseAdmin
      .from("issues")
      .select(
        "id, issue_number, slug, title, insight, insight_author, quote, quote_author, action_text, body, status, published_at",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return issue;
  });

export const updateAdminIssue = createServerFn({ method: "POST" })
  .inputValidator((input) => updateIssueSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin();

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("issues")
      .select("id, published_at")
      .eq("id", data.id)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error("Issue not found");

    const { error } = await supabaseAdmin
      .from("issues")
      .update({
        issue_number: data.issue_number,
        slug: data.slug,
        title: data.title,
        insight: data.insight,
        insight_author: data.insight_author || null,
        quote: data.quote,
        quote_author: data.quote_author || null,
        action_text: data.action_text,
        body: data.body || null,
        status: data.status,
        published_at:
          data.status === "published" ? existing.published_at || new Date().toISOString() : null,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listAdminSubscribers = createServerFn({ method: "GET" })
  .inputValidator((input) => subscriberListSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin();

    let query = supabaseAdmin
      .from("subscribers")
      .select("id, email, status, source, confirmed_at, unsubscribed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.status !== "all") {
      query = query.eq("status", data.status);
    }

    const { data: subscribers, error } = await query;
    if (error) throw new Error(error.message);
    return subscribers ?? [];
  });

export const getAdminSendNewsletterData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await requireAdmin();

  const [issues, activeSubscribers] = await Promise.all([
    supabaseAdmin
      .from("issues")
      .select("id, issue_number, title, status, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabaseAdmin
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  if (issues.error) throw new Error(issues.error.message);
  if (activeSubscribers.error) throw new Error(activeSubscribers.error.message);

  return {
    issues: issues.data ?? [],
    activeSubscriberCount: activeSubscribers.count ?? 0,
  };
});

export const sendAdminNewsletterIssue = createServerFn({ method: "POST" })
  .inputValidator((input) => sendIssueSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireAdmin();
    const baseUrl = getBaseUrl();

    const { data: issue, error: issueError } = await supabaseAdmin
      .from("issues")
      .select(
        "id, issue_number, title, insight, insight_author, quote, quote_author, action_text, body, status",
      )
      .eq("id", data.issueId)
      .eq("status", "published")
      .maybeSingle();

    if (issueError) throw new Error(issueError.message);
    if (!issue) throw new Error("Published issue not found");

    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (subscribersError) throw new Error(subscribersError.message);

    let recipients = subscribers ?? [];

    if (!data.resendToEveryone && recipients.length > 0) {
      const { data: previousDeliveries, error: previousDeliveriesError } = await supabaseAdmin
        .from("email_events")
        .select("subscriber_id")
        .eq("kind", "issue")
        .eq("status", "sent")
        .eq("issue_id", issue.id)
        .not("subscriber_id", "is", null);

      if (previousDeliveriesError) throw new Error(previousDeliveriesError.message);

      const alreadySentSubscriberIds = new Set(
        previousDeliveries
          ?.map((delivery) => delivery.subscriber_id)
          .filter((subscriberId): subscriberId is string => Boolean(subscriberId)) ?? [],
      );

      recipients = recipients.filter((subscriber) => !alreadySentSubscriberIds.has(subscriber.id));
    }

    let sent = 0;
    let failed = 0;

    for (const subscriber of recipients) {
      try {
        const response = await sendIssueEmail({
          to: subscriber.email,
          issue,
          unsubscribeUrl: `${baseUrl}/unsubscribe/${subscriber.unsubscribe_token}`,
        });
        await supabaseAdmin.from("email_events").insert({
          email: subscriber.email,
          kind: "issue",
          status: "sent",
          provider_id: response.id ?? null,
          subscriber_id: subscriber.id,
          issue_id: issue.id,
        });
        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await supabaseAdmin.from("email_events").insert({
          email: subscriber.email,
          kind: "issue",
          status: "failed",
          error: message,
          subscriber_id: subscriber.id,
          issue_id: issue.id,
        });
        failed += 1;
      }
    }

    return {
      ok: true as const,
      total: recipients.length,
      skipped: (subscribers?.length ?? 0) - recipients.length,
      resentToEveryone: data.resendToEveryone,
      sent,
      failed,
    };
  });
