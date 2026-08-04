"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import PublicLayoutShell from "@/components/pages/layout/shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegistration } from "@/hooks/use-registrations";
import { canPrintRegistrationTag } from "@/lib/name-tag";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const DownloadConfirmationPdf = dynamic(
  () =>
    import("@/components/pages/Events/DownloadConfirmationPdf").then(
      (mod) => mod.DownloadConfirmationPdf,
    ),
  {
    ssr: false,
    loading: () => (
      <span
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex opacity-60",
        )}
      >
        Preparing name tag...
      </span>
    ),
  },
);

export default function EventConfirmationPage({
  slug,
  registrationId,
  status,
}: {
  slug: string;
  registrationId?: string;
  status?: string;
}) {
  const { data: registration, isLoading } = useRegistration(registrationId);

  const isSuccess =
    status !== "failed" &&
    Boolean(registration && canPrintRegistrationTag(registration));
  const isFailed = status === "failed" || registration?.status === "FAILED";

  return (
    <PublicLayoutShell>
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
              {isSuccess ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-12 text-primary" />
                  <h1 className="text-2xl font-semibold">
                    Registration confirmed
                  </h1>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Download your A6 name tag (105mm × 148mm), print it, punch a
                    hole at the top, and wear it on a lanyard at the conference.
                  </p>
                </div>
              ) : isFailed ? (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="size-12 text-destructive" />
                  <h1 className="text-2xl font-semibold">
                    Registration incomplete
                  </h1>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-12 text-primary" />
                  <h1 className="text-2xl font-semibold">
                    Registration received
                  </h1>
                </div>
              )}

              {registration ? (
                <div className="flex w-full flex-col gap-2 text-left text-sm text-muted-foreground">
                  <div className="space-y-1 border-t pt-3">
                    <p>
                      <strong>Reference:</strong> {registration.id}
                    </p>
                    <p>
                      <strong>Event:</strong> {registration.eventTitle}
                    </p>
                    <p>
                      <strong>Payment status:</strong>{" "}
                      {registration.paymentStatus}
                    </p>
                    <p>
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(registration.amount)}
                    </p>
                    <p>
                      <strong>Registered:</strong>{" "}
                      {formatDate(registration.createdAt)}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="mb-2 font-medium text-primary">
                      Your responses
                    </p>
                    {registration.labeledResponses.map((entry) => (
                      <p key={entry.label}>
                        <strong>{entry.label}:</strong> {entry.value}
                      </p>
                    ))}
                  </div>

                  {registration.assignedGroup ? (
                    <div className="border-t pt-3">
                      <p>
                        <strong>Assigned group:</strong>{" "}
                        {registration.assignedGroup}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  We could not find your registration reference.
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                {isSuccess && registration ? (
                  <DownloadConfirmationPdf registration={registration} />
                ) : null}
                <Link
                  href={`/events/${slug}`}
                  className={cn(buttonVariants(), "inline-flex")}
                >
                  Back to event
                </Link>
                {registration?.tagsEnabled ? (
                  <Link
                    href={`/events/${slug}/reprint`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "inline-flex",
                    )}
                  >
                    Reprint tag later
                  </Link>
                ) : null}
                <Link
                  href="/events"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "inline-flex",
                  )}
                >
                  Browse events
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </PublicLayoutShell>
  );
}
