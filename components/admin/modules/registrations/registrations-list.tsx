"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import PageBreadcrumb from "@/components/admin/header/pagebreadcrumb";
import PageHeader from "@/components/admin/header/pageHeader";
import { DialogModal, ScrollableDialogModal } from "@/components/custom/custom-modal";
import CustomPagination from "@/components/custom/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useOrganizationHierarchy } from "@/hooks/use-organization";
import { useDeleteRegistration, useRegistrations } from "@/hooks/use-registrations";
import { exportToExcel } from "@/lib/export-excel";
import { canPrintRegistrationTag } from "@/lib/name-tag";
import {
  buildRegistrationExportRows,
  getRegistrationExportColumns,
} from "@/lib/registration-export";
import { matchesOrgFilters } from "@/lib/registration-org";
import { formatCurrency } from "@/lib/utils";
import type { RegistrationUI } from "@/validators/types/event";

import EditRegistrationDialog from "@/components/admin/modules/registrations/edit-registration-dialog";
import RegistrationRowActions from "@/components/admin/modules/registrations/registration-row-actions";
import UpdateRegistrationDialog from "@/components/admin/modules/registrations/update-registration-dialog";

const DownloadNameTagButton = dynamic(
  () =>
    import("@/components/pages/Events/DownloadConfirmationPdf").then(
      (mod) => mod.DownloadConfirmationPdf
    ),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        Preparing name tag...
      </Button>
    ),
  }
);

const PAGE_SIZE = 8;

function formatExportDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

interface AppliedFilter {
  key: string;
  label: string;
  onClear: () => void;
}

function canPrintTag(registration: RegistrationUI) {
  return canPrintRegistrationTag(registration);
}

function matchesSearch(registration: RegistrationUI, query: string) {
  const haystack = [
    registration.id,
    registration.contactName,
    registration.contactEmail,
    registration.contactPhone,
    registration.eventTitle,
    registration.responsePreview,
    registration.assignedGroup,
    registration.assignedHostel,
    ...registration.labeledResponses.map((entry) => `${entry.label} ${entry.value}`),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default function RegistrationsList() {
  const { data: events = [] } = useEvents();
  const { data: hierarchy } = useOrganizationHierarchy();
  const { mutateAsync: deleteRegistration, isLoading: isDeleting } =
    useDeleteRegistration();

  const [eventId, setEventId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [zoneId, setZoneId] = useState<string>("all");
  const [unitId, setUnitId] = useState<string>("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationUI | null>(null);
  const [fieldsEditTarget, setFieldsEditTarget] = useState<RegistrationUI | null>(null);
  const [statusEditTarget, setStatusEditTarget] = useState<RegistrationUI | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrationUI | null>(null);

  const eventsById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events]
  );

  function getRegistrationFormFields(registration: RegistrationUI) {
    return eventsById.get(registration.eventId)?.formFields ?? [];
  }

  function handleRegistrationUpdated(updated: RegistrationUI) {
    if (selectedRegistration?.id === updated.id) {
      setSelectedRegistration(updated);
    }
  }

  const filters = {
    eventId: eventId === "all" ? undefined : eventId,
    status:
      status === "all"
        ? undefined
        : (status as RegistrationUI["status"]),
    paymentStatus:
      paymentStatus === "all"
        ? undefined
        : (paymentStatus as RegistrationUI["paymentStatus"]),
  };

  const { data: registrations = [], isLoading, isError, refetch } =
    useRegistrations(filters);

  const zoneOptions = hierarchy?.zones ?? [];

  const unitOptions = useMemo(() => {
    if (zoneId === "all") {
      return zoneOptions.flatMap((zone) => zone.units);
    }
    return zoneOptions.find((zone) => zone.id === zoneId)?.units ?? [];
  }, [zoneId, zoneOptions]);

  const branchOptions = useMemo(() => {
    if (unitId !== "all") {
      return unitOptions.find((unit) => unit.id === unitId)?.branches ?? [];
    }
    if (zoneId !== "all") {
      return unitOptions.flatMap((unit) => unit.branches);
    }
    return zoneOptions.flatMap((zone) =>
      zone.units.flatMap((unit) => unit.branches)
    );
  }, [unitId, unitOptions, zoneId, zoneOptions]);

  const filteredRegistrations = useMemo(() => {
    const orgFilters = {
      zoneId: zoneId === "all" ? undefined : zoneId,
      unitId: unitId === "all" ? undefined : unitId,
      branchId: branchId === "all" ? undefined : branchId,
    };

    let result = registrations.filter((registration) =>
      matchesOrgFilters(registration, orgFilters)
    );

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((registration) => matchesSearch(registration, query));
    }

    return result;
  }, [registrations, zoneId, unitId, branchId, searchQuery]);

  const appliedFilters = useMemo(() => {
    const items: AppliedFilter[] = [];

    if (searchQuery.trim()) {
      items.push({
        key: "search",
        label: `Search: "${searchQuery.trim()}"`,
        onClear: () => {
          setSearchQuery("");
          setCurrentPage(1);
        },
      });
    }

    if (eventId !== "all") {
      const event = events.find((entry) => entry.id === eventId);
      items.push({
        key: "event",
        label: `Event: ${event?.title ?? eventId}`,
        onClear: () => {
          setEventId("all");
          setCurrentPage(1);
        },
      });
    }

    if (status !== "all") {
      items.push({
        key: "status",
        label: `Status: ${status}`,
        onClear: () => {
          setStatus("all");
          setCurrentPage(1);
        },
      });
    }

    if (paymentStatus !== "all") {
      items.push({
        key: "payment",
        label: `Payment: ${paymentStatus}`,
        onClear: () => {
          setPaymentStatus("all");
          setCurrentPage(1);
        },
      });
    }

    if (zoneId !== "all") {
      const zone = zoneOptions.find((entry) => entry.id === zoneId);
      items.push({
        key: "zone",
        label: `Zone: ${zone?.name ?? zoneId}`,
        onClear: () => {
          setZoneId("all");
          setUnitId("all");
          setBranchId("all");
          setCurrentPage(1);
        },
      });
    }

    if (unitId !== "all") {
      const unit = unitOptions.find((entry) => entry.id === unitId);
      items.push({
        key: "unit",
        label: `Unit: ${unit?.name ?? unitId}`,
        onClear: () => {
          setUnitId("all");
          setBranchId("all");
          setCurrentPage(1);
        },
      });
    }

    if (branchId !== "all") {
      const branch = branchOptions.find((entry) => entry.id === branchId);
      items.push({
        key: "branch",
        label: `Branch: ${branch?.name ?? branchId}`,
        onClear: () => {
          setBranchId("all");
          setCurrentPage(1);
        },
      });
    }

    return items;
  }, [
    branchId,
    branchOptions,
    eventId,
    events,
    paymentStatus,
    searchQuery,
    status,
    unitId,
    unitOptions,
    zoneId,
    zoneOptions,
  ]);

  function clearAllFilters() {
    setSearchQuery("");
    setEventId("all");
    setStatus("all");
    setPaymentStatus("all");
    setZoneId("all");
    setUnitId("all");
    setBranchId("all");
    setCurrentPage(1);
  }

  const totalCount = filteredRegistrations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalCount);
  const paginatedRegistrations = filteredRegistrations.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const exportColumns = useMemo(
    () => getRegistrationExportColumns(filteredRegistrations, events, eventId),
    [filteredRegistrations, events, eventId]
  );

  const exportRows = useMemo(
    () => buildRegistrationExportRows(filteredRegistrations, exportColumns, events),
    [filteredRegistrations, exportColumns, events]
  );

  function handleExport() {
    if (filteredRegistrations.length === 0) return;

    if (exportColumns.length === 0) {
      toast.error("No registration form fields found for the selected filters.");
      return;
    }

    const headers = exportColumns.map((column) => column.header);
    const filenameBase =
      eventId !== "all"
        ? `registrations-${events.find((event) => event.id === eventId)?.slug ?? eventId}`
        : "registrations-all-events";

    exportToExcel(exportRows, `${filenameBase}-${Date.now()}`, "Registrations", headers);
    toast.success(`Exported ${filteredRegistrations.length} registration(s).`);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const result = await deleteRegistration(deleteTarget.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete registration");
      return;
    }

    toast.success("Registration deleted");
    if (selectedRegistration?.id === deleteTarget.id) {
      setSelectedRegistration(null);
    }
    setDeleteTarget(null);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="m-4">
        <CardContent className="flex flex-col gap-3 py-8">
          <p>Failed to load registrations.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageBreadcrumb />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Registrations"
          description="View, print name tags, and manage attendee registrations."
        />
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={filteredRegistrations.length === 0}
          className="w-full shrink-0 sm:w-auto"
        >
          <Download className="size-4" data-icon="inline-start" />
          Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>All registrations</CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalCount} total
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Search by name, email, phone, or reference..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              className="md:col-span-2 xl:col-span-1"
            />
            <Select
              value={eventId}
              onValueChange={(value) => {
                if (value) {
                  setEventId(value);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                if (value) {
                  setStatus(value);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="ATTENDED">Attended</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={paymentStatus}
              onValueChange={(value) => {
                if (value) {
                  setPaymentStatus(value);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment statuses</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={zoneId}
              onValueChange={(value) => {
                if (value) {
                  setZoneId(value);
                  setUnitId("all");
                  setBranchId("all");
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All zones</SelectItem>
                {zoneOptions.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={unitId}
              onValueChange={(value) => {
                if (value) {
                  setUnitId(value);
                  setBranchId("all");
                  setCurrentPage(1);
                }
              }}
              disabled={zoneId !== "all" && unitOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={branchId}
              onValueChange={(value) => {
                if (value) {
                  setBranchId(value);
                  setCurrentPage(1);
                }
              }}
              disabled={branchOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {appliedFilters.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Applied filters</p>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {appliedFilters.map((filter) => (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="gap-1 pr-1 font-normal"
                  >
                    {filter.label}
                    <button
                      type="button"
                      onClick={filter.onClear}
                      className="rounded-sm p-0.5 hover:bg-background/80"
                      aria-label={`Remove ${filter.label}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "No registrations match your filters."
              : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} registration${totalCount === 1 ? "" : "s"}`}
          </p>

          {paginatedRegistrations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No registrations found.
            </div>
          ) : (
            paginatedRegistrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5 lg:gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 text-base leading-snug wrap-break-word">
                        {registration.contactName || registration.responsePreview}
                      </h3>
                      <Badge variant="secondary">{registration.status}</Badge>
                      <Badge>{registration.paymentStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground wrap-break-word">
                      {registration.eventTitle}
                    </p>
                    <div className="flex flex-col gap-1.5 lg:hidden">
                      {registration.contactEmail ? (
                        <p className="text-sm text-muted-foreground wrap-break-word">
                          {registration.contactEmail}
                        </p>
                      ) : null}
                      {registration.contactPhone ? (
                        <p className="text-sm text-muted-foreground">
                          {registration.contactPhone}
                        </p>
                      ) : null}
                      {registration.assignedGroup ? (
                        <p className="text-sm text-muted-foreground wrap-break-word">
                          Group: {registration.assignedGroup}
                        </p>
                      ) : null}
                      {registration.assignedHostel ? (
                        <p className="text-sm text-muted-foreground wrap-break-word">
                          Hostel: {registration.assignedHostel}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(registration.amount)} ·{" "}
                      {formatExportDate(registration.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-end border-t pt-3 lg:border-t-0 lg:pt-0">
                    <RegistrationRowActions
                      registration={registration}
                      showNameTag={canPrintTag(registration)}
                      nameTagAction={
                        canPrintTag(registration) ? (
                          <DownloadNameTagButton
                            registration={registration}
                            label="Download name tag"
                            size="sm"
                            className="w-full justify-start"
                          />
                        ) : null
                      }
                      onView={() => setSelectedRegistration(registration)}
                      onUpdate={() => setFieldsEditTarget(registration)}
                      onUpdateStatus={() => setStatusEditTarget(registration)}
                      onDelete={() => setDeleteTarget(registration)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <CustomPagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <ScrollableDialogModal
        open={Boolean(selectedRegistration)}
        onOpenChange={(open) => {
          if (!open) setSelectedRegistration(null);
        }}
        title="Registration details"
        maxWidth="sm:max-w-xl"
        scrollHeight="max-h-[60vh]"
      >
        {selectedRegistration ? (
          <div className="flex flex-col gap-3 text-sm pb-4">
            <p>
              <strong>Reference:</strong> {selectedRegistration.id}
            </p>
            <p>
              <strong>Event:</strong> {selectedRegistration.eventTitle}
            </p>
            <p>
              <strong>Status:</strong> {selectedRegistration.status}
            </p>
            <p>
              <strong>Payment:</strong> {selectedRegistration.paymentStatus}
            </p>
            <p>
              <strong>Amount:</strong> {formatCurrency(selectedRegistration.amount)}
            </p>
            <p>
              <strong>Payment ref:</strong> {selectedRegistration.paymentRef ?? "N/A"}
            </p>
            {selectedRegistration.assignedGroup ? (
              <p>
                <strong>Assigned group:</strong> {selectedRegistration.assignedGroup}
              </p>
            ) : null}
            {selectedRegistration.assignedHostel ? (
              <p>
                <strong>Assigned hostel:</strong> {selectedRegistration.assignedHostel}
              </p>
            ) : null}
            <div className="border-t pt-3 space-y-2">
              <p className="mb-2 font-medium text-primary">Form responses</p>
              {selectedRegistration.labeledResponses.map((entry) => (
                <p key={entry.label}>
                  <strong>{entry.label}:</strong> {entry.value}
                </p>
              ))}
            </div>
            <div className="flex justify-end border-t pt-3">
              <RegistrationRowActions
                registration={selectedRegistration}
                showNameTag={canPrintTag(selectedRegistration)}
                nameTagAction={
                  canPrintTag(selectedRegistration) ? (
                    <DownloadNameTagButton
                      registration={selectedRegistration}
                      label="Download name tag"
                      size="sm"
                      className="w-full justify-start"
                    />
                  ) : null
                }
                onView={() => setSelectedRegistration(selectedRegistration)}
                onUpdate={() => {
                  setFieldsEditTarget(selectedRegistration);
                  setSelectedRegistration(null);
                }}
                onUpdateStatus={() => {
                  setStatusEditTarget(selectedRegistration);
                  setSelectedRegistration(null);
                }}
                onDelete={() => {
                  setDeleteTarget(selectedRegistration);
                  setSelectedRegistration(null);
                }}
              />
            </div>
          </div>
        ) : null}
      </ScrollableDialogModal>

      <EditRegistrationDialog
        registration={fieldsEditTarget}
        formFields={
          fieldsEditTarget ? getRegistrationFormFields(fieldsEditTarget) : []
        }
        open={Boolean(fieldsEditTarget)}
        onOpenChange={(open) => {
          if (!open) setFieldsEditTarget(null);
        }}
        onUpdated={handleRegistrationUpdated}
      />

      <UpdateRegistrationDialog
        registration={statusEditTarget}
        open={Boolean(statusEditTarget)}
        onOpenChange={(open) => {
          if (!open) setStatusEditTarget(null);
        }}
        onUpdated={handleRegistrationUpdated}
      />

      <DialogModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete registration?"
        description={
          deleteTarget
            ? `This will permanently delete the registration for ${deleteTarget.contactName || deleteTarget.responsePreview}.`
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
