import type { RegistrationUI } from "@/validators/types/event";
import { isOrgBranchValue, type OrgBranchValue } from "@/validators/schemas/organization";

export function getOrgBranchFromRegistration(
  registration: RegistrationUI
): OrgBranchValue | null {
  for (const value of Object.values(registration.responses)) {
    if (isOrgBranchValue(value)) {
      return value;
    }
  }
  return null;
}

export function matchesOrgFilters(
  registration: RegistrationUI,
  filters: {
    zoneId?: string;
    unitId?: string;
    branchId?: string;
  }
) {
  const org = getOrgBranchFromRegistration(registration);
  if (!org) {
    return !filters.zoneId && !filters.unitId && !filters.branchId;
  }

  if (filters.zoneId && org.zoneId !== filters.zoneId) return false;
  if (filters.unitId && org.unitId !== filters.unitId) return false;
  if (filters.branchId && org.branchId !== filters.branchId) return false;

  return true;
}
