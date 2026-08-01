import { z } from "zod";
import { fieldHasOptions, normalizeFieldOptions, slugifyFieldKey } from "@/lib/form-fields";

export const FormFieldTypeEnum = z.enum([
  "TEXT",
  "TEXTAREA",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "DATE",
  "IMAGE",
  "ORG_BRANCH",
]);

export const FormFieldSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1, "Field label is required"),
    fieldKey: z.string().min(1, "Field key is required"),
    fieldType: FormFieldTypeEnum,
    placeholder: z.string(),
    helpText: z.string(),
    required: z.boolean(),
    options: z.array(z.string()),
    dependsOn: z.string().nullable().optional(),
    conditionalOptions: z
      .record(z.string(), z.array(z.string()))
      .nullable()
      .optional(),
    sortOrder: z.number().int().min(0),
  })
  .superRefine((field, ctx) => {
    const hasDependency = Boolean(field.dependsOn?.trim());

    if (fieldHasOptions(field.fieldType) && !hasDependency) {
      const options = normalizeFieldOptions(field.options);
      if (options.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one option for this field type",
          path: ["options"],
        });
      }
    }

    if (
      hasDependency &&
      (field.fieldType === "SELECT" || field.fieldType === "RADIO")
    ) {
      const conditionalOptions = field.conditionalOptions ?? {};
      const hasAnyOptions = Object.values(conditionalOptions).some(
        (options) => normalizeFieldOptions(options).length > 0
      );

      if (!hasAnyOptions) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one option for each parent value",
          path: ["conditionalOptions"],
        });
      }
    }
  });

export const FormFieldsSchema = z
  .array(FormFieldSchema)
  .min(1, "Add at least one registration field")
  .superRefine((fields, ctx) => {
    const keys = new Set<string>();

    for (const [index, field] of fields.entries()) {
      const key = field.fieldKey || slugifyFieldKey(field.label);
      if (keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Field keys must be unique",
          path: [index, "fieldKey"],
        });
      }
      keys.add(key);
    }

    const hasEmailField = fields.some((field) => field.fieldType === "EMAIL");
    if (!hasEmailField) {
      ctx.addIssue({
        code: "custom",
        message: "Include at least one Email field for confirmations and payments",
        path: [],
      });
    }

    for (const [index, field] of fields.entries()) {
      if (!field.dependsOn?.trim()) continue;

      const parentIndex = fields.findIndex(
        (candidate) => candidate.fieldKey === field.dependsOn
      );

      if (parentIndex === -1) {
        ctx.addIssue({
          code: "custom",
          message: "Parent field not found",
          path: [index, "dependsOn"],
        });
        continue;
      }

      const parent = fields[parentIndex];
      if (parent.fieldType !== "SELECT" && parent.fieldType !== "RADIO") {
        ctx.addIssue({
          code: "custom",
          message: "Parent field must be a Select or Radio group",
          path: [index, "dependsOn"],
        });
      }

      if (parent.fieldKey === field.fieldKey) {
        ctx.addIssue({
          code: "custom",
          message: "A field cannot depend on itself",
          path: [index, "dependsOn"],
        });
      }
    }
  });

export type FormFieldFormValues = z.infer<typeof FormFieldSchema>;
