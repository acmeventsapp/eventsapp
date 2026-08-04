"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Tag } from "lucide-react";
import PublicLayoutShell from "@/components/pages/layout/shell";
import BackButton from "@/components/custom/back-button";
import { ButtonSpinner } from "@/components/custom/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventBySlug } from "@/hooks/use-events";
import { useLookupRegistrationForReprint } from "@/hooks/use-registrations";
import { canPrintRegistrationTag } from "@/lib/name-tag";
import { cn } from "@/lib/utils";
import type { RegistrationUI } from "@/validators/types/event";

const DownloadConfirmationPdf = dynamic(
  () =>
    import("@/components/pages/Events/DownloadConfirmationPdf").then(
      (mod) => mod.DownloadConfirmationPdf
    ),
  {
    ssr: false,
    loading: () => (
      <span
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex opacity-60"
        )}
      >
        Preparing name tag...
      </span>
    ),
  }
);

export default function EventReprintTagPage({ slug }: { slug: string }) {
  const { data: event, isLoading: isLoadingEvent } = useEventBySlug(slug);
  const { mutateAsync: lookupRegistration, isLoading: isLookingUp } =
    useLookupRegistrationForReprint();

  const [email, setEmail] = useState("");
  const [registrationRef, setRegistrationRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationUI | null>(null);

  async function handleSubmit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setError(null);

    const result = await lookupRegistration({
      eventSlug: slug,
      email,
      registrationRef,
    });

    if (!result.success) {
      setRegistration(null);
      setError(result.error);
      return;
    }

    setRegistration(result.data);
  }

  if (isLoadingEvent) {
    return (
      <PublicLayoutShell>
        <div className="mx-auto max-w-xl px-4 py-10">
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicLayoutShell>
    );
  }

  if (!event || event.status !== "PUBLISHED") {
    return (
      <PublicLayoutShell>
        <div className="mx-auto max-w-xl px-4 py-10">
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

  if (!event.tagsEnabled) {
    return (
      <PublicLayoutShell>
        <div className="mx-auto max-w-xl px-4 py-10">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4">
                Name tags are not available for this event.
              </p>
              <Link
                href={`/events/${slug}`}
                className={cn(buttonVariants(), "inline-flex")}
              >
                Back to event
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayoutShell>
    );
  }

  const canDownload = registration && canPrintRegistrationTag(registration);

  return (
    <PublicLayoutShell>
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
        <BackButton label={event.title} href={`/events/${slug}`} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              <CardTitle>Reprint your name tag</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              Enter the email you used to register and your registration
              reference from your confirmation email. You can use the full
              reference or the last 8 characters.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="reprint-email">Email address</Label>
                <Input
                  id="reprint-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(eventInput) => setEmail(eventInput.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reprint-ref">Registration reference</Label>
                <Input
                  id="reprint-ref"
                  value={registrationRef}
                  onChange={(eventInput) =>
                    setRegistrationRef(eventInput.target.value)
                  }
                  placeholder="Full reference or last 8 characters"
                  required
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <Button type="submit" disabled={isLookingUp}>
                {isLookingUp ? (
                  <>
                    <ButtonSpinner />
                    Looking up registration...
                  </>
                ) : (
                  "Find my registration"
                )}
              </Button>
            </form>

            {canDownload ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-sm">
                  Found registration for{" "}
                  <strong>{registration.contactName || "Guest"}</strong>.
                </p>
                <DownloadConfirmationPdf
                  registration={registration}
                  label="Download name tag"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </PublicLayoutShell>
  );
}
