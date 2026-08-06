"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOrganizationHierarchy } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import type { EventFormValues } from "@/validators/schemas/event";

type BranchOption = {
  id: string;
  label: string;
  zoneName: string;
  unitName: string;
};

export default function HostelBuilder() {
  const form = useFormContext<EventFormValues>();
  const { data: hierarchy, isLoading, isError } = useOrganizationHierarchy();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "hostels",
  });
  const watchedHostels = form.watch("hostels");

  const branchOptions = useMemo<BranchOption[]>(() => {
    const options: BranchOption[] = [];

    for (const zone of hierarchy?.zones ?? []) {
      for (const unit of zone.units) {
        for (const branch of unit.branches) {
          options.push({
            id: branch.id,
            label: branch.name,
            zoneName: zone.name,
            unitName: unit.name,
          });
        }
      }
    }

    return options;
  }, [hierarchy?.zones]);

  const branchUsage = useMemo(() => {
    const usage = new Map<string, number>();

    for (const [hostelIndex, hostel] of (watchedHostels ?? []).entries()) {
      for (const branchId of hostel.branchIds ?? []) {
        usage.set(branchId, hostelIndex);
      }
    }

    return usage;
  }, [watchedHostels]);

  function toggleBranch(hostelIndex: number, branchId: string, checked: boolean) {
    const current = form.getValues(`hostels.${hostelIndex}.branchIds`) ?? [];
    const next = checked
      ? Array.from(new Set([...current, branchId]))
      : current.filter((id) => id !== branchId);

    form.setValue(`hostels.${hostelIndex}.branchIds`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div>
        <h3 className="text-base text-primary">Hostel allocation</h3>
        <p className="text-sm text-muted-foreground">
          Optional. Map one or more branches to a hostel for this event.
          Registrants are assigned automatically based on the branch they
          selected during registration.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading branches...</p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive">
          Failed to load organization hierarchy.
        </p>
      ) : null}

      {!isLoading && branchOptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No branches found. Set up the organization hierarchy first under
          Admin → Organization.
        </div>
      ) : null}

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No hostels configured for this event.
        </div>
      ) : (
        fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base text-primary">Hostel {index + 1}</h3>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name={`hostels.${index}.name`}
              render={({ field: nameField }) => (
                <FormItem>
                  <FormLabel>Hostel name</FormLabel>
                  <FormControl>
                    <Input {...nameField} placeholder="Hostel A" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`hostels.${index}.branchIds`}
              render={() => {
                const selectedBranchIds =
                  form.watch(`hostels.${index}.branchIds`) ?? [];

                return (
                  <FormItem>
                    <FormLabel>Assigned branches</FormLabel>
                    <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
                      {branchOptions.map((branch) => {
                        const usedByHostel = branchUsage.get(branch.id);
                        const isSelected = selectedBranchIds.includes(branch.id);
                        const isDisabled =
                          usedByHostel !== undefined && usedByHostel !== index;

                        return (
                          <label
                            key={branch.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border p-3",
                              isSelected && "border-primary/40 bg-primary/5",
                              isDisabled && "cursor-not-allowed opacity-50"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) =>
                                toggleBranch(index, branch.id, checked === true)
                              }
                            />
                            <span className="min-w-0 text-sm">
                              <span className="block font-medium">
                                {branch.label}
                              </span>
                              <span className="text-muted-foreground">
                                {branch.zoneName} / {branch.unitName}
                              </span>
                              {isDisabled ? (
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  Already assigned to Hostel {usedByHostel! + 1}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        ))
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() =>
          append({
            name: "",
            branchIds: [],
            sortOrder: fields.length,
          })
        }
      >
        <Plus className="size-4" data-icon="inline-start" />
        Add hostel
      </Button>
    </div>
  );
}
