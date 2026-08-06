import type { z } from "zod";
import type { FieldErrors, FieldPath, FieldValues } from "react-hook-form";

export type FlatFormError = {
  path: string;
  message: string;
};

const ERROR_META_KEYS = new Set(["message", "type", "ref", "types", "root"]);

export function flattenFormErrors<T extends FieldValues>(
  errors: FieldErrors<T> | undefined | null,
  prefix = ""
): FlatFormError[] {
  if (!errors) return [];

  const result: FlatFormError[] = [];

  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && "message" in value) {
      const message = value.message;
      if (typeof message === "string" && message.trim()) {
        result.push({ path, message });
      }
    }

    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        if (item && typeof item === "object") {
          result.push(
            ...flattenFormErrors(
              item as FieldErrors<FieldValues>,
              `${path}.${index}`
            )
          );
        }
      }
      continue;
    }

    if (value && typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (ERROR_META_KEYS.has(nestedKey)) continue;
        if (!nestedValue || typeof nestedValue !== "object") continue;

        result.push(
          ...flattenFormErrors(
            nestedValue as FieldErrors<FieldValues>,
            `${path}.${nestedKey}`
          )
        );
      }
    }
  }

  return result;
}

export function getSchemaErrorsForFields(
  schema: z.ZodTypeAny,
  values: unknown,
  fields: readonly string[]
): FlatFormError[] {
  const parsed = schema.safeParse(values);
  if (parsed.success) return [];

  return parsed.error.issues
    .filter((issue) => {
      const path = issue.path.map(String).join(".");
      if (!path) {
        return fields.includes("formFields");
      }

      return fields.some(
        (field) => path === field || path.startsWith(`${field}.`)
      );
    })
    .map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  description: "Description",
  bannerImage: "Banner image",
  startDate: "Start date",
  endDate: "End date",
  venue: "Venue",
  capacity: "Capacity",
  isFree: "Free event",
  ticketPrice: "Ticket price",
  tagsEnabled: "Name tags",
  tagPrimaryColor: "Tag primary color",
  tagSecondaryColor: "Tag secondary color",
  tagFooterText: "Tag footer text",
  tagFieldKeys: "Tag fields",
  formFields: "Registration fields",
  speakers: "Speakers",
  assignmentGroups: "Assignment groups",
  hostels: "Hostels",
  status: "Status",
};

export function formatFormErrorPath(path: string) {
  const segments = path.split(".");
  const root = segments[0] ?? path;

  if (root === "formFields" && segments.length === 1) {
    return FIELD_LABELS.formFields;
  }

  if (root === "formFields" && segments.length >= 2) {
    const index = Number(segments[1]);
    const fieldSegment = segments[2];
    const fieldLabel = fieldSegment
      ? FIELD_LABELS[fieldSegment] ?? fieldSegment
      : "Field";

    if (!Number.isNaN(index)) {
      return `Registration field ${index + 1}: ${fieldLabel}`;
    }
  }

  return FIELD_LABELS[root] ?? path;
}

export function findStepForErrorPath<T extends string>(
  path: string,
  steps: ReadonlyArray<{ id: T; fields: readonly string[] }>
): T | null {
  for (const step of steps) {
    for (const field of step.fields) {
      if (path === field || path.startsWith(`${field}.`)) {
        return step.id;
      }
    }
  }

  return null;
}

export function getStepValidationFields<T extends Record<string, unknown>>(
  stepFields: readonly FieldPath<T>[],
  stepId: string,
  tagsEnabled: boolean
): FieldPath<T>[] {
  if (stepId !== "registration") {
    return [...stepFields];
  }

  if (tagsEnabled) {
    return [...stepFields];
  }

  return stepFields.filter(
    (field) =>
      field === "isFree" ||
      field === "ticketPrice" ||
      field === "formFields" ||
      field === "tagsEnabled"
  ) as FieldPath<T>[];
}
