import type { FormFieldType } from "@prisma/client";
import type { FormFieldFormValues, FormFieldUI } from "@/validators/types/form-field";

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  TEXT: "Short text",
  TEXTAREA: "Long text",
  EMAIL: "Email",
  PHONE: "Phone",
  NUMBER: "Number",
  SELECT: "Select",
  RADIO: "Radio group",
  CHECKBOX: "Checkboxes",
  DATE: "Date",
  IMAGE: "Photo upload",
  ORG_BRANCH: "Branch / Organization unit",
};

export const DEFAULT_EVENT_FORM_FIELDS: FormFieldFormValues[] = [
  {
    label: "Full Name",
    fieldKey: "full_name",
    fieldType: "TEXT",
    placeholder: "Enter your full name",
    helpText: "",
    required: true,
    options: [],
    dependsOn: null,
    conditionalOptions: null,
    sortOrder: 0,
  },
  {
    label: "Email Address",
    fieldKey: "email",
    fieldType: "EMAIL",
    placeholder: "you@example.com",
    helpText: "",
    required: true,
    options: [],
    dependsOn: null,
    conditionalOptions: null,
    sortOrder: 1,
  },
  {
    label: "Phone Number",
    fieldKey: "phone",
    fieldType: "PHONE",
    placeholder: "+234...",
    helpText: "",
    required: true,
    options: [],
    dependsOn: null,
    conditionalOptions: null,
    sortOrder: 2,
  },
];

export function slugifyFieldKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "field";
}

export function normalizeFieldOptions(options: string[] | undefined) {
  return (options ?? [])
    .map((option) => option.trim())
    .filter(Boolean);
}

export function fieldHasOptions(fieldType: FormFieldType) {
  return fieldType === "SELECT" || fieldType === "RADIO" || fieldType === "CHECKBOX";
}

export function isMultiValueField(field: Pick<FormFieldUI, "fieldType" | "options">) {
  return field.fieldType === "CHECKBOX" && normalizeFieldOptions(field.options).length > 0;
}

export function extractContactFromResponses(
  fields: FormFieldUI[],
  responses: Record<string, unknown>
) {
  let contactEmail = "";
  let contactName = "";
  let contactPhone = "";

  for (const field of fields) {
    const value = responses[field.fieldKey];
    if (typeof value !== "string" || !value.trim()) continue;

    if (field.fieldType === "EMAIL") contactEmail = value.trim();
    if (field.fieldType === "PHONE") contactPhone = value.trim();
    if (field.fieldKey === "full_name") contactName = value.trim();
  }

  if (!contactName) {
    const firstTextField = fields.find((field) => field.fieldType === "TEXT");
    const firstValue = firstTextField ? responses[firstTextField.fieldKey] : undefined;
    if (typeof firstValue === "string" && firstValue.trim()) {
      contactName = firstValue.trim();
    }
  }

  return { contactEmail, contactName, contactPhone };
}

export function formatResponseValue(value: unknown, fieldType?: FormFieldType): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  if (
    fieldType === "IMAGE" &&
    typeof value === "string" &&
    /^https?:\/\/.+/i.test(value)
  ) {
    return "Photo provided";
  }
  if (
    (fieldType === "ORG_BRANCH" || typeof value === "object") &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const org = value as {
      zoneName?: string;
      unitName?: string;
      branchName?: string;
    };
    const parts = [org.zoneName, org.unitName, org.branchName].filter(
      (part): part is string => Boolean(part && part.trim())
    );
    if (parts.length > 0) return parts.join(" / ");
  }
  return String(value);
}

export function getResponsePreview(
  fields: FormFieldUI[],
  responses: Record<string, unknown>
) {
  const primaryField =
    fields.find((field) => field.fieldKey === "full_name") ??
    fields.find((field) => field.fieldType === "TEXT") ??
    fields[0];

  if (!primaryField) return "Registration";

  return formatResponseValue(responses[primaryField.fieldKey], primaryField.fieldType) || "Registration";
}
