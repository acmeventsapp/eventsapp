"use client";

import Link from "next/link";
import { Calendar, MapPin, Mic2, Users, BookOpen } from "lucide-react";
import PublicLayoutShell from "@/components/pages/layout/shell";
import BackButton from "@/components/custom/back-button";
import { ImagePreview } from "@/components/custom/image-preview";
import EventShareButtons from "@/components/pages/Events/EventShareButtons";
import EventQrCodeDownload from "@/components/pages/Events/EventQrCodeDownload";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventBySlug } from "@/hooks/use-events";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export default function EventDetailPage({ slug }: { slug: string }) {
  const { data: event, isLoading, isError } = useEventBySlug(slug);

  if (isLoading) {
    return (
      <PublicLayoutShell>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicLayoutShell>
    );
  }

  if (isError || !event || event.status !== "PUBLISHED") {
    return (
      <PublicLayoutShell>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4">Event not found or unavailable.</p>
              <Link href="/events" className={cn(buttonVariants())}>
                Back to events
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayoutShell>
    );
  }

  const soldOut = event.remainingSeats <= 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/events/${event.slug}`;
  const hasSpeakers = event.speakers.length > 0;

  return (
    <PublicLayoutShell>
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <div>
          <BackButton label="Events" href="/events" />
        </div>

        {event.bannerImage ? (
          <ImagePreview
            src={event.bannerImage}
            alt={`${event.title} flyer`}
            className="block h-72 w-full rounded-xl"
          />
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold">{event.title}</h1>
                <Badge>
                  {event.isFree
                    ? "Free"
                    : formatCurrency(event.ticketPrice ?? 0)}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4 shrink-0" />
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  {event.venue}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="size-4 shrink-0" />
                  {event.remainingSeats} of {event.capacity} seats remaining
                </span>
              </div>
            </div>

            <Card className="relative overflow-hidden shadow-xs bg-card/60 backdrop-blur-xs h-full">
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-3/4 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                aria-hidden
              />
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-3 pl-5">
                <div className="flex items-center gap-2 text-asm-terracotta">
                  <BookOpen className="size-5" />
                  <CardTitle className="text-lg font-semibold">
                    About this Event
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-6 pl-5">
                <div
                  className="prose max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
                  dangerouslySetInnerHTML={{
                    __html: event.description.replace(/\n/g, "<br />"),
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 lg:max-w-xs">
            <EventShareButtons
              url={shareUrl}
              title={event.title}
              description={event.description}
            />
            <EventQrCodeDownload url={shareUrl} title={event.title} />
          </div>
        </div>

        {hasSpeakers ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Mic2 className="size-5 text-asm-terracotta" />
              <h2 className="text-xl font-semibold">Speakers</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {event.speakers.map((speaker) => (
                <Card key={speaker.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start gap-4 pb-3">
                    {speaker.photoUrl ? (
                      <ImagePreview
                        src={speaker.photoUrl}
                        alt={speaker.name}
                        className="size-16 shrink-0 rounded-full ring-2 ring-asm-lime-green/30"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-asm-lime-green/20 text-lg font-semibold text-asm-terracotta">
                        {speaker.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {speaker.name}
                      </CardTitle>
                      {speaker.role ? (
                        <p className="text-sm text-asm-terracotta">
                          {speaker.role}
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>
                  {speaker.bio ? (
                    <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">
                      {speaker.bio}
                    </CardContent>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {soldOut ? (
            <Button disabled>Sold out</Button>
          ) : (
            <Link
              href={`/events/${event.slug}/register`}
              className={cn(buttonVariants(), "inline-flex")}
            >
              {event.isFree ? "Register for free" : "Register & pay"}
            </Link>
          )}
          {event.tagsEnabled ? (
            <Link
              href={`/events/${event.slug}/reprint`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex",
              )}
            >
              Reprint your tag
            </Link>
          ) : null}
          <Link
            href="/events"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex",
            )}
          >
            Back to events
          </Link>
        </div>
      </article>
    </PublicLayoutShell>
  );
}
