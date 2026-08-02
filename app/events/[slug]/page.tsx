import type { Metadata } from "next";
import EventDetailPage from "@/components/pages/Events/EventDetail";
import { getEventBySlug } from "@/data/events";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function toPlainDescription(description: string) {
  return description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  const siteUrl = getSiteUrl();

  if (!event || event.status !== "PUBLISHED") {
    return {
      title: "Event not found | ACM Events Center",
    };
  }

  const url = `${siteUrl}/events/${event.slug}`;
  const description =
    toPlainDescription(event.description).slice(0, 160) ||
    `Register for ${event.title} on ACM Ugwuagba Arch Events Center.`;

  return {
    title: `${event.title} | ACM Events Center`,
    description,
    openGraph: {
      title: event.title,
      description,
      url,
      siteName: "ACM Ugwuagba Arch Events Center",
      type: "website",
      ...(event.bannerImage
        ? {
            images: [
              {
                url: event.bannerImage,
                alt: `${event.title} flyer`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: event.bannerImage ? "summary_large_image" : "summary",
      title: event.title,
      description,
      ...(event.bannerImage ? { images: [event.bannerImage] } : {}),
    },
  };
}

export default async function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventDetailPage slug={slug} />;
}
