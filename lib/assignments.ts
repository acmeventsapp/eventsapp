import { isOrgBranchValue } from "@/validators/schemas/organization";
import type { RegistrationResponses } from "@/validators/types/event";

function normalizeResponseValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(String).join(", ").trim();
  return "";
}

export function matchesAssignmentGroupFilter(
  responses: RegistrationResponses,
  group: {
    targetFieldKey: string | null;
    targetFieldValue: string | null;
  }
) {
  const fieldKey = group.targetFieldKey?.trim();
  if (!fieldKey) return true;

  const requiredValue = group.targetFieldValue?.trim();
  if (!requiredValue) return true;

  const actualValue = normalizeResponseValue(responses[fieldKey]);
  return actualValue.localeCompare(requiredValue, undefined, {
    sensitivity: "accent",
  }) === 0;
}

export function getBranchIdFromResponses(
  responses: RegistrationResponses,
  formFields: Array<{ fieldType: string; fieldKey: string }>
) {
  for (const field of formFields) {
    if (field.fieldType !== "ORG_BRANCH") continue;
    const value = responses[field.fieldKey];
    if (isOrgBranchValue(value)) {
      return value.branchId;
    }
  }

  return null;
}

export function parseHostelBranchIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
