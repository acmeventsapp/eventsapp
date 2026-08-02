import Link from "next/link";
import PublicLayoutShell from "@/components/pages/layout/shell";
import {
  EventListingIllustration,
  GuestRegistrationIllustration,
  PaymentIllustration,
} from "@/components/pages/Home/feature-illustrations";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, ClipboardList, CreditCard } from "lucide-react";

const features = [
  {
    title: "ACM events & programs",
    description:
      "See upcoming conferences, retreats, gatherings, and other ACM Ugwuagba Arch programs in one place — paid and free.",
    illustration: EventListingIllustration,
    icon: CalendarDays,
    accent: "from-brand-green/20 to-asm-ivory dark:from-brand-green/15 dark:to-muted",
  },
  {
    title: "Simple registration",
    description:
      "Register for ACM events in a few minutes. No account needed — just fill in the form and confirm your spot.",
    illustration: GuestRegistrationIllustration,
    icon: ClipboardList,
    accent: "from-primary/15 to-asm-ivory dark:from-primary/20 dark:to-muted",
  },
  {
    title: "Secure online payment",
    description:
      "Pay for tickets through Paystack and receive instant confirmation, email updates, and your printable name tag.",
    illustration: PaymentIllustration,
    icon: CreditCard,
    accent: "from-brand-gold/20 to-asm-ivory dark:from-brand-gold/10 dark:to-muted",
  },
] as const;

export default function HomePage() {
  return (
    <PublicLayoutShell>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative inline-flex items-center overflow-hidden rounded-full border border-primary/20 bg-card px-1 py-1 shadow-sm">
            <span className="flex items-center gap-2 pl-4 pr-3 py-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-green opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                ACM
              </span>
              <span className="h-3 w-px bg-border" aria-hidden />
              <span className="text-sm font-medium text-foreground">
                Ugwuagba Arch
              </span>
            </span>
          </div>

          <h1 className="max-w-4xl font-semibold tracking-tight text-[2.5rem] lg:text-5xl xl:text-[3.8rem] leading-tight md:leading-[1.1]">
            ACM Ugwuagba Arch{" "}
            <span className="text-primary">Events Center</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Register for paid and free events, and let admins track the
            organization directory — zones, units, and branches — from one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/events" className={cn(buttonVariants({ size: "lg" }))}>
              View ACM events
            </Link>
            <Link
              href="/admin/auth/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              ACM admin login
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, description, illustration: Illustration, icon: Icon, accent }) => (
            <Card
              key={title}
              className="group overflow-hidden border-border bg-card shadow-sm transition-shadow hover:shadow-md dark:border-border dark:shadow-none dark:ring-1 dark:ring-white/10"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center bg-linear-to-br px-6 pt-8 pb-4",
                  accent
                )}
              >
                <div className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-card/80 shadow-sm">
                  <Icon className="size-4 text-primary" />
                </div>
                <Illustration />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayoutShell>
  );
}
