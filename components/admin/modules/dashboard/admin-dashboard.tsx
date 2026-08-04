"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CreditCard,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EmptyContentComponent } from "@/components/custom/empty-content";
import { useAdminSession } from "@/hooks/use-admin-session";
import { useEvents } from "@/hooks/use-events";
import { useRegistrations } from "@/hooks/use-registrations";
import PageHeader from "@/components/admin/header/pageHeader";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function getAdminFirstName(email?: string) {
  if (!email) return "Admin";
  return email.split("@")[0]?.replace(/[._-]/g, " ") ?? "Admin";
}

function StatCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  color,
  bgColor,
  href,
  loading,
  highlight,
}: {
  title: string;
  value: number | string;
  description: string;
  trend: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
  loading?: boolean;
  highlight?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-1 h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "relative overflow-hidden py-4 transition-shadow hover:shadow-md ",
          highlight && "border-primary/50"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-0">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`rounded-lg p-2 ${bgColor}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </CardHeader>
        <CardContent className="py-0">
          <div className="truncate text-2xl font-bold">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <Badge variant="secondary" size={"sm"} className="mt-2 text-xs">
            {trend}
          </Badge>
        </CardContent>

        <div className="pointer-events-none  dark:hidden absolute right-0 bottom-0 flex h-2/3 w-2/3 items-end justify-end overflow-hidden opacity-5">
          <Icon
            className={cn(
              "h-full w-full -rotate-45 translate-x-1/4 translate-y-1/4 transform",
              color
            )}
          />
        </div>
      </Card>
    </Link>
  );
}

function SummaryMetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  loading,
}: {
  title: string;
  value: number | string;
  subtext: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-6">
          <div className={`shrink-0 rounded-full p-3 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-black dark:text-white">{title}</p>
            <p className="truncate text-2xl font-bold text-black dark:text-white">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RegistrationDistributionChart({
  paidCount,
  freeCount,
  unpaidCount,
  loading,
}: {
  paidCount: number;
  freeCount: number;
  unpaidCount: number;
  loading: boolean;
}) {
  const chartData = useMemo(() => {
    const items = [
      { label: "Paid", count: paidCount },
      { label: "Free", count: freeCount },
      { label: "Unpaid", count: unpaidCount },
    ];
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return items.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
    }));
  }, [paidCount, freeCount, unpaidCount]);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    chartData.forEach((item, index) => {
      config[item.label] = {
        label: item.label,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  const topSegment = useMemo(() => {
    if (total === 0) return null;
    return [...chartData].sort((a, b) => b.count - a.count)[0];
  }, [chartData, total]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const isEmpty = total === 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Registration Distribution
        </CardTitle>
        <CardDescription>
          Breakdown of registrations by payment status
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {isEmpty ? (
          <EmptyContentComponent
            icon={<Users className="h-12 w-12" />}
            label="No registrations yet"
            description="Activity will appear here once participants start registering for events."
            className="w-full"
          />
        ) : (
          <div className="flex flex-col items-center lg:flex-row">
            <>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-70 shrink-0"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, _name, item) => {
                          const data = item.payload as {
                            label: string;
                            count: number;
                            percentage: number;
                          };
                          const count =
                            typeof value === "number" ? value : data.count;
                          const pct = data.percentage ?? 0;
                          return (
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="text-muted-foreground">
                                {data.label}
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {count} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={65}
                    strokeWidth={5}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {total}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground text-sm"
                              >
                                Total
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-2 lg:mr-6">
                {chartData.map((item, index) => {
                  const config =
                    chartConfig[item.label as keyof typeof chartConfig];
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{
                          backgroundColor:
                            (config && "color" in config
                              ? config.color
                              : undefined) ??
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      <span className="font-medium capitalize">
                        {config?.label || item.label}
                      </span>
                      <span className="ml-auto text-muted-foreground">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          </div>
        )}
      </CardContent>

      {!isEmpty && topSegment && (
        <CardFooter className="flex-col items-start gap-2 pt-7 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {topSegment.label}: {topSegment.percentage.toFixed(1)}% of total{" "}
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing paid, free, and unpaid registrations across all events
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: admin, isLoading: loadingSession } = useAdminSession();
  const { data: events = [], isLoading: loadingEvents } = useEvents();
  const { data: registrations = [], isLoading: loadingRegistrations } =
    useRegistrations();

  const publishedEvents = events.filter((event) => event.status === "PUBLISHED").length;
  const draftEvents = events.filter((event) => event.status === "DRAFT").length;
  const confirmedRegistrations = registrations.filter(
    (registration) => registration.status === "CONFIRMED"
  ).length;
  const pendingRegistrations = registrations.filter(
    (registration) => registration.status === "PENDING"
  ).length;
  const paidCount = registrations.filter(
    (registration) => registration.paymentStatus === "PAID"
  ).length;
  const freeCount = registrations.filter(
    (registration) => registration.paymentStatus === "FREE"
  ).length;
  const unpaidCount = registrations.filter(
    (registration) => registration.paymentStatus === "UNPAID"
  ).length;
  const totalRevenue = registrations
    .filter((registration) => registration.paymentStatus === "PAID")
    .reduce((sum, registration) => sum + registration.amount, 0);

  const chartLoading = loadingRegistrations;
  const firstName = getAdminFirstName(admin?.email);

  const greeting = (
    <span>
      Welcome back, <span className="text-primary">{firstName}</span>
    </span>
  );

  return (
    <div className="space-y-4 py-4 md:px-2">
      <div>
        {loadingSession ? (
          <Skeleton className="mb-2 h-9 w-64" />
        ) : (
          <PageHeader
            title={greeting}
            description="Overview of ACM events, registrations, and payments."
          />
        )}
      </div>

      {unpaidCount > 0 && (
        <Card className="border-primary bg-primary/5 dark:bg-primary/20">
          <CardContent className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-primary-foreground">
                Action required
              </p>
              <p className="text-sm text-primary dark:text-primary-foreground">
                {unpaidCount} registration(s) awaiting payment
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/admin/registrations">Review registrations</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={events.length}
          description="All events in the system"
          trend="Event management"
          icon={CalendarDays}
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-950"
          href="/admin/events"
          loading={loadingEvents}
        />
        <StatCard
          title="Published Events"
          value={publishedEvents}
          description="Open for registration"
          trend="Live on website"
          icon={CalendarCheck2}
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-950"
          href="/admin/events"
          loading={loadingEvents}
        />
        <StatCard
          title="Registrations"
          value={registrations.length}
          description="All sign-ups recorded"
          trend="Participant activity"
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-950"
          href="/admin/registrations"
          loading={loadingRegistrations}
        />
        <StatCard
          title="Confirmed"
          value={confirmedRegistrations}
          description="Completed registrations"
          trend={
            pendingRegistrations > 0
              ? `${pendingRegistrations} pending`
              : "All clear"
          }
          icon={CreditCard}
          color="text-orange-600"
          bgColor="bg-orange-100 dark:bg-orange-950"
          href="/admin/registrations"
          loading={loadingRegistrations}
          highlight={pendingRegistrations > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RegistrationDistributionChart
            paidCount={paidCount}
            freeCount={freeCount}
            unpaidCount={unpaidCount}
            loading={chartLoading}
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <SummaryMetricCard
            title="Paid Registrations"
            value={paidCount}
            subtext="Successfully paid tickets"
            icon={CreditCard}
            iconBg="bg-green-100 dark:bg-green-950"
            iconColor="text-green-600"
            href="/admin/registrations"
            loading={loadingRegistrations}
          />
          <SummaryMetricCard
            title="Free Registrations"
            value={freeCount}
            subtext="No payment required"
            icon={Users}
            iconBg="bg-blue-100 dark:bg-blue-950"
            iconColor="text-blue-600"
            href="/admin/registrations"
            loading={loadingRegistrations}
          />
          <SummaryMetricCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtext="From paid event tickets"
            icon={TrendingUp}
            iconBg="bg-orange-100 dark:bg-orange-950"
            iconColor="text-orange-600"
            href="/admin/settings/payment"
            loading={loadingRegistrations}
          />
          <SummaryMetricCard
            title="Draft Events"
            value={draftEvents}
            subtext="Not yet published"
            icon={FileText}
            iconBg="bg-purple-100 dark:bg-purple-950"
            iconColor="text-purple-600"
            href="/admin/events"
            loading={loadingEvents}
          />
        </div>
      </div>
    </div>
  );
}
