"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationHierarchy } from "@/hooks/use-organization";
import {
  isOrgBranchValue,
  type OrgBranchValue,
} from "@/validators/schemas/organization";

interface OrgHierarchyPickerProps {
  value?: OrgBranchValue | null | string;
  onChange: (value: OrgBranchValue | null) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export default function OrgHierarchyPicker({
  value,
  onChange,
  disabled,
  required,
  id,
}: OrgHierarchyPickerProps) {
  const { data: hierarchy, isLoading, isError } = useOrganizationHierarchy();
  const parsedValue = isOrgBranchValue(value) ? value : null;

  const [selection, setSelection] = useState(() => ({
    zoneId: parsedValue?.zoneId ?? "",
    unitId: parsedValue?.unitId ?? "",
    branchId: parsedValue?.branchId ?? "",
  }));

  useEffect(() => {
    setSelection({
      zoneId: parsedValue?.zoneId ?? "",
      unitId: parsedValue?.unitId ?? "",
      branchId: parsedValue?.branchId ?? "",
    });
  }, [parsedValue?.zoneId, parsedValue?.unitId, parsedValue?.branchId]);

  const zones = hierarchy?.zones ?? [];

  const units = useMemo(() => {
    return zones.find((zone) => zone.id === selection.zoneId)?.units ?? [];
  }, [selection.zoneId, zones]);

  const branches = useMemo(() => {
    return units.find((unit) => unit.id === selection.unitId)?.branches ?? [];
  }, [selection.unitId, units]);

  function emitChange(next: { zoneId: string; unitId: string; branchId: string }) {
    setSelection(next);

    if (!next.zoneId || !next.unitId || !next.branchId) {
      onChange(null);
      return;
    }

    const zone = zones.find((item) => item.id === next.zoneId);
    const unit = zone?.units.find((item) => item.id === next.unitId);
    const branch = unit?.branches.find((item) => item.id === next.branchId);

    if (!zone || !unit || !branch) {
      onChange(null);
      return;
    }

    onChange({
      zoneId: zone.id,
      zoneName: zone.name,
      unitId: unit.id,
      unitName: unit.name,
      branchId: branch.id,
      branchName: branch.name,
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading organization units...</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load organization hierarchy. Please try again.
      </p>
    );
  }

  if (!hierarchy?.archdeaconry || zones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Organization hierarchy has not been set up yet. Contact an administrator.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3" id={id}>
      <div className="flex flex-col gap-2">
        <Label>
          Zone
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
        <Select
          value={selection.zoneId || undefined}
          disabled={disabled}
          onValueChange={(zoneId) =>
            emitChange({ zoneId, unitId: "", branchId: "" })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Unit
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
        <Select
          value={selection.unitId || undefined}
          disabled={disabled || !selection.zoneId}
          onValueChange={(unitId) =>
            emitChange({ ...selection, unitId, branchId: "" })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                selection.zoneId ? "Select unit" : "Select zone first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Branch
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
        <Select
          value={selection.branchId || undefined}
          disabled={disabled || !selection.unitId}
          onValueChange={(branchId) => emitChange({ ...selection, branchId })}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                selection.unitId ? "Select branch" : "Select unit first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
