import { z } from "zod";

export const ArchdeaconrySchema = z.object({
  name: z.string().trim().min(1, "Archdeaconry name is required"),
});

export const ZoneSchema = z.object({
  name: z.string().trim().min(1, "Zone name is required"),
});

export const UnitSchema = z.object({
  name: z.string().trim().min(1, "Unit name is required"),
  zoneId: z.string().min(1, "Zone is required"),
});

export const BranchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required"),
  unitId: z.string().min(1, "Unit is required"),
});

export const OrgBranchValueSchema = z.object({
  zoneId: z.string().min(1),
  zoneName: z.string().min(1),
  unitId: z.string().min(1),
  unitName: z.string().min(1),
  branchId: z.string().min(1),
  branchName: z.string().min(1),
});

export type ArchdeaconryFormValues = z.infer<typeof ArchdeaconrySchema>;
export type ZoneFormValues = z.infer<typeof ZoneSchema>;
export type UnitFormValues = z.infer<typeof UnitSchema>;
export type BranchFormValues = z.infer<typeof BranchSchema>;
export type OrgBranchValue = z.infer<typeof OrgBranchValueSchema>;

export function isOrgBranchValue(value: unknown): value is OrgBranchValue {
  return OrgBranchValueSchema.safeParse(value).success;
}
