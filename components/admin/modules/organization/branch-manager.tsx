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
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUnits,
  useUpdateBranch,
} from "@/hooks/use-organization";
import type { BranchUI } from "@/data/organization";

const ALL_UNITS = "__all__";

export default function BranchManager() {
  const { data: units = [] } = useUnits();
  const [unitFilter, setUnitFilter] = useState(ALL_UNITS);
  const filterUnitId = unitFilter === ALL_UNITS ? undefined : unitFilter;
  const { data: branches = [], isLoading } = useBranches(filterUnitId);
  const { mutateAsync: createBranch, isLoading: isCreating } = useCreateBranch();
  const { mutateAsync: updateBranch, isLoading: isUpdating } = useUpdateBranch();
  const { mutateAsync: deleteBranch, isLoading: isDeleting } = useDeleteBranch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BranchUI | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BranchUI | null>(null);

  const parentOptions = useMemo(
    () =>
      units.map((unit) => ({
        id: unit.id,
        name: `${unit.name} (${unit.zoneName})`,
      })),
    [units]
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(branch: BranchUI) {
    setEditing(branch);
    setDialogOpen(true);
  }

  async function handleSubmit(values: { name: string; unitId: string }) {
    const result = editing
      ? await updateBranch({ id: editing.id, data: values })
      : await createBranch(values);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save branch");
      return;
    }

    toast.success(editing ? "Branch updated" : "Branch created");
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteBranch(deleteTarget.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete branch");
      return;
    }
    toast.success("Branch deleted");
    setDeleteTarget(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Branches</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Branches are the smallest units and appear in registration forms.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_UNITS}>All units</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.zoneName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            disabled={units.length === 0}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Add branch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least one unit before creating branches.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading branches...</p>
        ) : branches.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No branches found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} className="border-t">
                    <td className="px-4 py-3">{branch.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {branch.unitName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {branch.zoneName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(branch)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteTarget(branch)}
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
        kind="branch"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit branch" : "Add branch"}
        initialName={editing?.name ?? ""}
        initialParentId={
          editing?.unitId ??
          (unitFilter !== ALL_UNITS ? unitFilter : parentOptions[0]?.id ?? "")
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
        title="Delete branch?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.name}.`
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
