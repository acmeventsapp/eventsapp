"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageBreadcrumb from "@/components/admin/header/pagebreadcrumb";
import PageHeader from "@/components/admin/header/pageHeader";
import { DialogModal } from "@/components/custom/custom-modal";
import { ImagePreview } from "@/components/custom/image-preview";
import CustomPagination from "@/components/custom/pagination";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteEvent, useEvents } from "@/hooks/use-events";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { runAfterDropdownClose } from "@/lib/dropdown-modal";
import type { EventUI } from "@/validators/types/event";

const PAGE_SIZE = 6;

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

type SortOption =
  | "date-created-desc"
  | "date-created-asc"
  | "title-asc"
  | "title-desc";

function sortEvents(events: EventUI[], sortBy: SortOption) {
  const sorted = [...events];

  switch (sortBy) {
    case "date-created-asc":
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "date-created-desc":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function EventThumbnail({ event }: { event: EventUI }) {
  if (event.bannerImage) {
    return (
      <ImagePreview
        src={event.bannerImage}
        alt={`${event.title} banner`}
        className="block h-36 w-full shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36"
        imageClassName="object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-36 w-full shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground sm:h-24 sm:w-36"
      aria-hidden
    >
      <CalendarDays className="size-8 opacity-60" />
    </div>
  );
}

export default function EventsList() {
  const { data: events = [], isLoading, isError, refetch } = useEvents();
  const { mutateAsync: deleteEvent, isLoading: isDeleting } = useDeleteEvent();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-created-desc");
  const [month, setMonth] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<EventUI | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set(
      events.map((event) => new Date(event.startDate).getFullYear()),
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const startDate = new Date(event.startDate);
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesYear =
        year === "all" || startDate.getFullYear() === Number(year);
      const matchesMonth =
        month === "all" || startDate.getMonth() + 1 === Number(month);

      return matchesSearch && matchesYear && matchesMonth;
    });
    return sortEvents(filtered, sortBy);
  }, [events, searchQuery, sortBy, month, year]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteEvent(deleteTarget.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete event");
      return;
    }
    toast.success("Event deleted");
    setDeleteTarget(null);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="m-4">
        <CardContent className="flex flex-col gap-3 py-8">
          <p>Failed to load events.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 px-0 sm:px-2">
      <PageBreadcrumb />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Events"
          description="Create and manage organization events."
        />
        <Link
          href="/admin/events/new"
          className={cn(
            buttonVariants(),
            "inline-flex w-full shrink-0 gap-2 sm:w-auto",
          )}
        >
          <Plus className="size-4" />
          New event
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              className="md:col-span-2 xl:col-span-1"
            />
            <Select
              value={year}
              onValueChange={(value) => {
                if (value) {
                  setYear(value);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map((yearOption) => (
                  <SelectItem key={yearOption} value={String(yearOption)}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={month}
              onValueChange={(value) => {
                if (value) {
                  setMonth(value);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTHS.map((monthOption) => (
                  <SelectItem key={monthOption.value} value={monthOption.value}>
                    {monthOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                if (value) {
                  setSortBy(value as SortOption);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-created-desc">
                  Date created (newest)
                </SelectItem>
                <SelectItem value="date-created-asc">
                  Date created (oldest)
                </SelectItem>
                <SelectItem value="title-asc">Alphabetical (A–Z)</SelectItem>
                <SelectItem value="title-desc">Alphabetical (Z–A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredEvents.length === 0
              ? "No events match your filters."
              : `${filteredEvents.length} event${filteredEvents.length === 1 ? "" : "s"}`}
          </p>

          {paginatedEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No events found.
            </div>
          ) : (
            paginatedEvents.map((eventItem) => (
              <Card key={eventItem.id}>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                    <EventThumbnail event={eventItem} />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 text-base leading-snug wrap-break-word">
                          {eventItem.title}
                        </h3>
                        <Badge variant="secondary">{eventItem.status}</Badge>
                        <Badge>
                          {eventItem.isFree
                            ? "Free"
                            : formatCurrency(eventItem.ticketPrice ?? 0)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(eventItem.startDate)}
                      </p>
                      <p className="text-sm text-muted-foreground wrap-break-word">
                        {eventItem.venue}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {eventItem.registrationCount}/{eventItem.capacity}{" "}
                        registered
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t pt-3 lg:border-t-0 lg:pt-0">
                    <Link
                      href={`/events/${eventItem.slug}`}
                      target="_blank"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex flex-1 justify-center sm:flex-none",
                      )}
                    >
                      View public page
                    </Link>
                    <DropdownMenu
                      modal={false}
                      open={openMenuId === eventItem.id}
                      onOpenChange={(open) =>
                        setOpenMenuId(open ? eventItem.id : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/events/${eventItem.id}/edit`}>
                            <Pencil className="size-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setOpenMenuId(null);
                            runAfterDropdownClose(() =>
                              setDeleteTarget(eventItem),
                            );
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <DialogModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete event?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.title} and all related registrations.`
            : undefined
        }
        showFooter
        saveLabel="Delete"
        cancelLabel="Cancel"
        saveVariant="destructive"
        saveDisabled={isDeleting}
        onSave={handleDelete}
      />
    </div>
  );
}
