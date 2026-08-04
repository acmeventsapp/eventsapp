"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogModal } from "@/components/custom/custom-modal";
import OrgItemDialog from "@/components/admin/modules/organization/org-item-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateUnit,
  useDeleteUnit,
  useUnits,
  useUpdateUnit,
  useZones,
} from "@/hooks/use-organization";
import type { UnitUI } from "@/data/organization";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const ALL_ZONES = "__all__";

export default function UnitManager() {
  const { data: zones = [] } = useZones();
  const [zoneFilter, setZoneFilter] = useState(ALL_ZONES);
  const filterZoneId = zoneFilter === ALL_ZONES ? undefined : zoneFilter;
  const { data: units = [], isLoading } = useUnits(filterZoneId);
  const { mutateAsync: createUnit, isLoading: isCreating } = useCreateUnit();
  const { mutateAsync: updateUnit, isLoading: isUpdating } = useUpdateUnit();
  const { mutateAsync: deleteUnit, isLoading: isDeleting } = useDeleteUnit();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitUI | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitUI | null>(null);

  const parentOptions = useMemo(
    () => zones.map((zone) => ({ id: zone.id, name: zone.name })),
    [zones],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(unit: UnitUI) {
    setEditing(unit);
    setDialogOpen(true);
  }

  async function handleSubmit(values: { name: string; zoneId: string }) {
    const result = editing
      ? await updateUnit({ id: editing.id, data: values })
      : await createUnit(values);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save unit");
      return;
    }

    toast.success(editing ? "Unit updated" : "Unit created");
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteUnit(deleteTarget.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete unit");
      return;
    }
    toast.success("Unit deleted");
    setDeleteTarget(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Units</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Units belong to a Zone and contain Branches.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ZONES}>All zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            disabled={zones.length === 0}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Add unit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least one zone before creating units.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading units...</p>
        ) : units.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No units found for this filter.
          </div>
        ) : (
          <ScrollArea className="w-full grid">
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Zone</th>
                    <th className="px-4 py-3 font-medium">Branches</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id} className="border-t">
                      <td className="px-4 py-3">{unit.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {unit.zoneName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {unit.branchCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit(unit)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteTarget(unit)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>

      <OrgItemDialog
        kind="unit"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit unit" : "Add unit"}
        initialName={editing?.name ?? ""}
        initialParentId={
          editing?.zoneId ??
          (zoneFilter !== ALL_ZONES ? zoneFilter : (parentOptions[0]?.id ?? ""))
        }
        parentOptions={parentOptions}
        isSaving={isCreating || isUpdating}
        onSubmit={handleSubmit}
      />

      <DialogModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete unit?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.name} and all of its branches.`
            : undefined
        }
        showFooter
        saveLabel="Delete"
        cancelLabel="Cancel"
        saveVariant="destructive"
        saveDisabled={isDeleting}
        onSave={handleDelete}
      />
    </Card>
  );
}
