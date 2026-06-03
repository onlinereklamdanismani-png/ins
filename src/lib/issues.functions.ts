import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const slugSchema = z.object({
  slug: z.string().trim().min(1).max(140),
});

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const listPublishedIssues = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("issues")
    .select("id, issue_number, slug, title, insight, quote_author, status, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPublishedIssue = createServerFn({ method: "GET" })
  .inputValidator((input) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicSupabaseClient();
    const { data: issue, error } = await supabase
      .from("issues")
      .select(
        "id, issue_number, slug, title, insight, insight_author, quote, quote_author, action_text, body, published_at",
      )
      .eq("status", "published")
      .eq("slug", data.slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return issue;
  });
