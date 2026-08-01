"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogModal } from "@/components/custom/custom-modal";
import OrgItemDialog from "@/components/admin/modules/organization/org-item-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useArchdeaconry,
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useZones,
} from "@/hooks/use-organization";
import type { ZoneUI } from "@/data/organization";

export default function ZoneManager() {
  const { data: archdeaconry, isLoading: loadingArchdeaconry } = useArchdeaconry();
  const { data: zones = [], isLoading } = useZones();
  const { mutateAsync: createZone, isLoading: isCreating } = useCreateZone();
  const { mutateAsync: updateZone, isLoading: isUpdating } = useUpdateZone();
  const { mutateAsync: deleteZone, isLoading: isDeleting } = useDeleteZone();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ZoneUI | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ZoneUI | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(zone: ZoneUI) {
    setEditing(zone);
    setDialogOpen(true);
  }

  async function handleSubmit(values: { name: string }) {
    const result = editing
      ? await updateZone({ id: editing.id, data: values })
      : await createZone(values);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save zone");
      return;
    }

    toast.success(editing ? "Zone updated" : "Zone created");
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteZone(deleteTarget.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete zone");
      return;
    }
    toast.success("Zone deleted");
    setDeleteTarget(null);
  }

  const canManage = Boolean(archdeaconry);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Zones</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Zones belong to the Archdeaconry and contain Units.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          disabled={!canManage || loadingArchdeaconry}
        >
          <Plus className="size-4" data-icon="inline-start" />
          Add zone
        </Button>
      </CardHeader>
      <CardContent>
        {!canManage && !loadingArchdeaconry ? (
          <p className="text-sm text-muted-foreground">
            Create the Archdeaconry first before adding zones.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading zones...</p>
        ) : zones.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No zones yet. Add your first zone to begin organizing units.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className="border-t">
                    <td className="px-4 py-3">{zone.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {zone.unitCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(zone)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteTarget(zone)}
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
        )}
      </CardContent>

      <OrgItemDialog
        kind="zone"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit zone" : "Add zone"}
        initialName={editing?.name ?? ""}
        isSaving={isCreating || isUpdating}
        onSubmit={handleSubmit}
      />

      <DialogModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete zone?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.name} and all of its units and branches.`
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
