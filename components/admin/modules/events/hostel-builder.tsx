"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationHierarchy } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import type { EventFormValues } from "@/validators/schemas/event";

type BranchOption = {
  id: string;
  label: string;
  zoneName: string;
  unitName: string;
};

type BranchUsageEntry = {
  hostelIndex: number;
  gender: "MALE" | "FEMALE";
};

const GENDER_LABELS = {
  MALE: "Male hostel",
  FEMALE: "Female hostel",
} as const;

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

  const branchOptionsById = useMemo(() => {
    return new Map(branchOptions.map((branch) => [branch.id, branch]));
  }, [branchOptions]);

  const branchUsage = useMemo(() => {
    const usage = new Map<string, BranchUsageEntry[]>();

    for (const [hostelIndex, hostel] of (watchedHostels ?? []).entries()) {
      for (const branchId of hostel.branchIds ?? []) {
        const entries = usage.get(branchId) ?? [];
        entries.push({ hostelIndex, gender: hostel.gender });
        usage.set(branchId, entries);
      }
    }

    return usage;
  }, [watchedHostels]);

  function canSelectBranch(
    branchId: string,
    hostelIndex: number,
    hostelGender: "MALE" | "FEMALE"
  ) {
    const entries = branchUsage.get(branchId) ?? [];
    const alreadySelectedHere = entries.some(
      (entry) => entry.hostelIndex === hostelIndex
    );

    if (alreadySelectedHere) {
      return { allowed: true, reason: null };
    }

    if (entries.length >= 2) {
      return {
        allowed: false,
        reason: "Already assigned to male and female hostels",
      };
    }

    const sameGenderTaken = entries.some(
      (entry) => entry.gender === hostelGender
    );
    if (sameGenderTaken) {
      return {
        allowed: false,
        reason: `Already assigned to a ${hostelGender === "MALE" ? "male" : "female"} hostel`,
      };
    }

    return { allowed: true, reason: null };
  }

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
          Optional. Map branches to male or female hostels for this event. Each
          branch can appear on up to two hostels — one male and one female.
          Registrants are assigned based on their branch and gender answer.
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
        fields.map((field, index) => {
          const hostelGender =
            form.watch(`hostels.${index}.gender`) ?? "MALE";
          const selectedBranchIds =
            form.watch(`hostels.${index}.branchIds`) ?? [];
          const selectedBranches = selectedBranchIds
            .map((branchId) => branchOptionsById.get(branchId))
            .filter((branch): branch is BranchOption => Boolean(branch));

          return (
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

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`hostels.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormLabel>Hostel name</FormLabel>
                      <FormControl>
                        <Input {...nameField} placeholder="Hostel A" />
                      </FormControl>
                      {selectedBranches.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedBranches.map((branch) => (
                            <Badge key={branch.id} variant="secondary">
                              {branch.label}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`hostels.${index}.gender`}
                  render={({ field: genderField }) => (
                    <FormItem>
                      <FormLabel>Hostel type</FormLabel>
                      <Select
                        value={genderField.value}
                        onValueChange={(value) => {
                          genderField.onChange(value);
                          form.trigger(`hostels.${index}.branchIds`);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select hostel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">
                            {GENDER_LABELS.MALE}
                          </SelectItem>
                          <SelectItem value="FEMALE">
                            {GENDER_LABELS.FEMALE}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`hostels.${index}.branchIds`}
                render={() => {
                  return (
                    <FormItem>
                      <FormLabel>Assigned branches</FormLabel>
                      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
                        {branchOptions.map((branch) => {
                          const isSelected = selectedBranchIds.includes(
                            branch.id
                          );
                          const availability = canSelectBranch(
                            branch.id,
                            index,
                            hostelGender
                          );
                          const isDisabled = !isSelected && !availability.allowed;

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
                                  toggleBranch(
                                    index,
                                    branch.id,
                                    checked === true
                                  )
                                }
                              />
                              <span className="min-w-0 text-sm">
                                <span className="block font-medium">
                                  {branch.label}
                                </span>
                                <span className="text-muted-foreground">
                                  {branch.zoneName} / {branch.unitName}
                                </span>
                                {isDisabled && availability.reason ? (
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    {availability.reason}
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
          );
        })
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() =>
          append({
            name: "",
            gender: "MALE",
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
