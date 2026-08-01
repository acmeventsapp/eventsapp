import { z } from "zod";
import {
  isMultiValueField,
  normalizeFieldOptions,
} from "@/lib/form-fields";
import {
  isOrgBranchValue,
  OrgBranchValueSchema,
  type OrgBranchValue,
} from "@/validators/schemas/organization";
import type { RegistrationResponses } from "@/validators/types/event";
import type { FormFieldUI } from "@/validators/types/form-field";

export type DynamicRegistrationValues = Record<
  string,
  string | string[] | boolean | OrgBranchValue | null
>;

function buildFieldValidator(field: FormFieldUI) {
  const label = field.label;
  const options = normalizeFieldOptions(field.options);

  if (field.fieldType === "ORG_BRANCH") {
    return field.required
      ? OrgBranchValueSchema
      : OrgBranchValueSchema.nullable();
  }

  if (field.fieldType === "EMAIL") {
    let schema = z.string().email(`Enter a valid ${label.toLowerCase()}`);
    return field.required ? schema.min(1, `${label} is required`) : schema.or(z.literal(""));
  }

  if (field.fieldType === "PHONE") {
    let schema = z.string().min(7, `${label} is required`);
    return field.required ? schema : schema.or(z.literal(""));
  }

  if (field.fieldType === "NUMBER") {
    let schema = z.string().refine(
      (value) => value === "" || !Number.isNaN(Number(value)),
      `${label} must be a number`
    );
    return field.required
      ? schema.refine((value) => value.trim() !== "", `${label} is required`)
      : schema;
  }

  if (field.fieldType === "DATE") {
    let schema = z.string();
    return field.required
      ? schema.min(1, `${label} is required`)
      : schema;
  }

  if (field.fieldType === "IMAGE") {
    let schema = z.string().refine(
      (value) => value === "" || /^https?:\/\/.+/i.test(value),
      `Upload a valid photo for ${label.toLowerCase()}`
    );
    if (field.required) {
      schema = schema.refine(
        (value) => value.trim() !== "",
        `${label} is required`
      );
    }
    return schema;
  }

  if (isMultiValueField(field)) {
    let schema = z.array(z.string());
    if (field.required) {
      schema = schema.min(1, `Select at least one option for ${label}`);
    }
    return schema;
  }

  if (field.fieldType === "CHECKBOX" && options.length === 0) {
    let schema = z.boolean();
    if (field.required) {
      schema = schema.refine((value) => value === true, `${label} is required`);
    }
    return schema;
  }

  if (field.fieldType === "SELECT" || field.fieldType === "RADIO") {
    let schema = z.string();
    if (field.required) {
      schema = schema.min(1, `${label} is required`);
    }
    if (!field.dependsOn && options.length > 0) {
      schema = schema.refine(
        (value) => value === "" || options.includes(value),
        `Select a valid option for ${label}`
      );
    }
    return schema;
  }

  let schema = z.string();
  if (field.required) {
    schema = schema.min(1, `${label} is required`);
  }
  return schema;
}

export function buildDynamicRegistrationSchema(fields: FormFieldUI[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.fieldKey] = buildFieldValidator(field);
  }

  return z
    .object(shape)
    .superRefine((values, ctx) => {
      for (const field of fields) {
        if (!field.dependsOn || !field.conditionalOptions) continue;

        const parentValue = values[field.dependsOn];
        if (typeof parentValue !== "string" || !parentValue.trim()) continue;

        const allowed = normalizeFieldOptions(
          field.conditionalOptions[parentValue] ?? []
        );
        const childValue = values[field.fieldKey];

        if (typeof childValue !== "string" || !childValue.trim()) continue;

        if (!allowed.includes(childValue)) {
          ctx.addIssue({
            code: "custom",
            message: `Select a valid option for ${field.label}`,
            path: [field.fieldKey],
          });
        }
      }
    }) as z.ZodType<DynamicRegistrationValues>;
}

export function buildDynamicRegistrationDefaults(fields: FormFieldUI[]) {
  const defaults: DynamicRegistrationValues = {};

  for (const field of fields) {
    if (isMultiValueField(field)) {
      defaults[field.fieldKey] = [];
      continue;
    }

    if (field.fieldType === "CHECKBOX" && normalizeFieldOptions(field.options).length === 0) {
      defaults[field.fieldKey] = false;
      continue;
    }

    if (field.fieldType === "ORG_BRANCH") {
      defaults[field.fieldKey] = null;
      continue;
    }

    defaults[field.fieldKey] = "";
  }

  return defaults;
}

export function serializeRegistrationResponses(
  fields: FormFieldUI[],
  values: DynamicRegistrationValues
) {
  const responses: RegistrationResponses = {};

  for (const field of fields) {
    const value = values[field.fieldKey];

    if (isMultiValueField(field)) {
      responses[field.fieldKey] = Array.isArray(value) ? value : [];
      continue;
    }

    if (field.fieldType === "CHECKBOX" && normalizeFieldOptions(field.options).length === 0) {
      responses[field.fieldKey] = Boolean(value);
      continue;
    }

    if (field.fieldType === "ORG_BRANCH") {
      if (isOrgBranchValue(value)) {
        responses[field.fieldKey] = value;
      }
      continue;
    }

    responses[field.fieldKey] = typeof value === "string" ? value : String(value ?? "");
  }

  return responses;
}
