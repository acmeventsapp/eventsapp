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

export function normalizeGenderValue(value: string): "MALE" | "FEMALE" | null {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return null;
  if (/^female|girl|woman/.test(normalized) || normalized === "f") {
    return "FEMALE";
  }
  if (/^male|boy|man/.test(normalized) || normalized === "m") {
    return "MALE";
  }
  if (normalized.includes("female")) return "FEMALE";
  if (normalized.includes("male")) return "MALE";

  return null;
}

export function getRegistrantGender(
  responses: RegistrationResponses,
  formFields: Array<{ fieldType: string; fieldKey: string; label: string }>
): "MALE" | "FEMALE" | null {
  for (const field of formFields) {
    const isGenderField =
      /gender|sex/i.test(field.fieldKey) || /gender|sex/i.test(field.label);

    if (!isGenderField) continue;

    const gender = normalizeGenderValue(
      normalizeResponseValue(responses[field.fieldKey])
    );
    if (gender) return gender;
  }

  return null;
}

export function findHostelForRegistrant(
  hostels: Array<{
    id: string;
    name: string;
    gender: "MALE" | "FEMALE";
    branchIds: unknown;
  }>,
  branchId: string,
  registrantGender: "MALE" | "FEMALE" | null
) {
  const matchingHostels = hostels.filter((hostel) =>
    parseHostelBranchIds(hostel.branchIds).includes(branchId)
  );

  if (matchingHostels.length === 0) {
    return null;
  }

  if (registrantGender) {
    return (
      matchingHostels.find((hostel) => hostel.gender === registrantGender) ??
      null
    );
  }

  return matchingHostels.length === 1 ? matchingHostels[0] : null;
}
