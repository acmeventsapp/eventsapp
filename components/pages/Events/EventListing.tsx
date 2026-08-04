"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  Users,
} from "lucide-react";
import PublicLayoutShell from "@/components/pages/layout/shell";
import BackButton from "@/components/custom/back-button";
import { ImagePreview } from "@/components/custom/image-preview";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-events";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { EventUI } from "@/validators/types/event";

type SortOption =
  | "date-created-desc"
  | "date-created-asc"
  | "title-asc"
  | "title-desc";

type LayoutMode = "grid" | "list";

function sortEvents(events: EventUI[], sortBy: SortOption) {
  const sorted = [...events];

  switch (sortBy) {
    case "date-created-asc":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "date-created-desc":
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

function EventCard({ event, layout }: { event: EventUI; layout: LayoutMode }) {
  const isList = layout === "list";
  const soldOut = event.remainingSeats <= 0;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-md",
        isList ? "sm:flex sm:min-h-36" : "flex h-full flex-col"
      )}
    >
      {event.bannerImage ? (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-muted",
            isList ? "h-44 w-full sm:h-auto sm:w-44 sm:self-stretch" : "h-44 w-full"
          )}
        >
          <ImagePreview
            src={event.bannerImage}
            alt={`${event.title} flyer`}
            className="block size-full"
            imageClassName="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5",
          isList
            ? "sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            : "h-full"
        )}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={cn("leading-snug", isList ? "text-lg" : "text-xl")}>
              {event.title}
            </CardTitle>
            <Badge variant={event.isFree ? "secondary" : "primary"}>
              {event.isFree ? "Free" : formatCurrency(event.ticketPrice ?? 0)}
            </Badge>
            {soldOut ? <Badge variant="outline">Sold out</Badge> : null}
          </div>

          {event.description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                isList ? "line-clamp-2" : "line-clamp-3"
              )}
            >
              {event.description}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Calendar className="size-4 shrink-0 text-primary/70" />
              {formatDate(event.startDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-primary/70" />
              <span className="truncate">{event.venue}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 shrink-0 text-primary/70" />
              {soldOut
                ? "No seats remaining"
                : `${event.remainingSeats} seats remaining`}
            </span>
          </div>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className={cn(
            buttonVariants(),
            "inline-flex w-fit shrink-0",
            isList ? "sm:self-center" : "mt-auto"
          )}
        >
          View details
        </Link>
      </div>
    </Card>
  );
}

export default function EventsListingPage() {
  const { data: events = [], isLoading } = useEvents({ publishedOnly: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-created-desc");
  const [layout, setLayout] = useState<LayoutMode>("list");

  const displayedEvents = useMemo(() => {
    const filtered = events.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortEvents(filtered, sortBy);
  }, [events, searchQuery, sortBy]);

  return (
    <PublicLayoutShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 pb-10">
        <div>
          <BackButton label="Home" href="/" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Upcoming <span className="text-asm-terracotta">Events</span>
          </h1>
          <p className="text-muted-foreground">
            Browse organization events and register as a guest.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="sm:flex-1"
          />

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => {
                if (value) setSortBy(value as SortOption);
              }}
            >
              <SelectTrigger className="w-full min-w-44 sm:w-52">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-created-desc">Date created (newest)</SelectItem>
                <SelectItem value="date-created-asc">Date created (oldest)</SelectItem>
                <SelectItem value="title-asc">Alphabetical (A–Z)</SelectItem>
                <SelectItem value="title-desc">Alphabetical (Z–A)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={layout === "grid" ? "Switch to list layout" : "Switch to grid layout"}
              onClick={() => setLayout((current) => (current === "grid" ? "list" : "grid"))}
            >
              {layout === "grid" ? <List /> : <LayoutGrid />}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div
            className={cn(
              "grid gap-4",
              layout === "grid" ? "md:grid-cols-2" : "grid-cols-1"
            )}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn("w-full", layout === "grid" ? "h-56" : "h-40")}
              />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No published events available right now.
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              layout === "grid" ? "md:grid-cols-2" : "grid-cols-1"
            )}
          >
            {displayedEvents.map((event) => (
              <EventCard key={event.id} event={event} layout={layout} />
            ))}
          </div>
        )}
      </section>
    </PublicLayoutShell>
  );
}
