import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InsightQuotes Weekly — One idea. One quote. One action." },
      {
        name: "description",
        content:
          "A free weekly newsletter for curious professionals: one powerful idea, one quote, and one practical action in a 5-minute read.",
      },
      { property: "og:title", content: "InsightQuotes Weekly" },
      {
        property: "og:description",
        content: "One idea. One quote. One action. Every Sunday. Free.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap",
      },
    ],
  }),
  component: LandingPage,
});
