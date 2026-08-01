"use client";

import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  createBranch,
  createUnit,
  createZone,
  deleteBranch,
  deleteUnit,
  deleteZone,
  getArchdeaconry,
  getBranches,
  getOrganizationHierarchy,
  getUnits,
  getZones,
  updateBranch,
  updateUnit,
  updateZone,
  upsertArchdeaconry,
} from "@/data/organization";
import type {
  ArchdeaconryFormValues,
  BranchFormValues,
  UnitFormValues,
  ZoneFormValues,
} from "@/validators/schemas/organization";

export const ORGANIZATION_KEYS = {
  all: ["organization"] as const,
  archdeaconry: ["organization", "archdeaconry"] as const,
  zones: ["organization", "zones"] as const,
  units: (zoneId?: string) => ["organization", "units", zoneId ?? "all"] as const,
  branches: (unitId?: string) =>
    ["organization", "branches", unitId ?? "all"] as const,
  hierarchy: ["organization", "hierarchy"] as const,
};

function invalidateOrganization(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries(ORGANIZATION_KEYS.all);
}

export function useArchdeaconry() {
  return useQuery(ORGANIZATION_KEYS.archdeaconry, getArchdeaconry);
}

export function useUpsertArchdeaconry() {
  const queryClient = useQueryClient();
  return useMutation((data: ArchdeaconryFormValues) => upsertArchdeaconry(data), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useZones() {
  return useQuery(ORGANIZATION_KEYS.zones, getZones);
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation((data: ZoneFormValues) => createZone(data), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: ZoneFormValues }) => updateZone(id, data),
    { onSuccess: () => invalidateOrganization(queryClient) }
  );
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => deleteZone(id), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useUnits(zoneId?: string) {
  return useQuery(ORGANIZATION_KEYS.units(zoneId), () => getUnits(zoneId));
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation((data: UnitFormValues) => createUnit(data), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: UnitFormValues }) => updateUnit(id, data),
    { onSuccess: () => invalidateOrganization(queryClient) }
  );
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => deleteUnit(id), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useBranches(unitId?: string) {
  return useQuery(ORGANIZATION_KEYS.branches(unitId), () => getBranches(unitId));
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation((data: BranchFormValues) => createBranch(data), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: BranchFormValues }) =>
      updateBranch(id, data),
    { onSuccess: () => invalidateOrganization(queryClient) }
  );
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => deleteBranch(id), {
    onSuccess: () => invalidateOrganization(queryClient),
  });
}

export function useOrganizationHierarchy() {
  return useQuery(ORGANIZATION_KEYS.hierarchy, getOrganizationHierarchy);
}
