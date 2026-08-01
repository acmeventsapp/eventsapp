import type { FormFieldUI } from "@/validators/types/form-field";

type TagFieldCandidate = Pick<FormFieldUI, "fieldType" | "fieldKey">;

export function isTagEligibleField(field: TagFieldCandidate) {
  return (
    field.fieldType !== "EMAIL" &&
    field.fieldType !== "PHONE" &&
    field.fieldType !== "IMAGE" &&
    field.fieldType !== "ORG_BRANCH"
  );
}

export function parseTagFieldKeys(value: unknown): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

export function defaultTagFieldKeys(formFields: TagFieldCandidate[]) {
  return formFields.filter(isTagEligibleField).map((field) => field.fieldKey);
}

export function sanitizeTagFieldKeys(
  tagFieldKeys: string[],
  formFields: TagFieldCandidate[]
) {
  const eligibleKeys = new Set(
    formFields.filter(isTagEligibleField).map((field) => field.fieldKey)
  );

  return tagFieldKeys.filter((key) => eligibleKeys.has(key));
}
