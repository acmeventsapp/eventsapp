import { z } from "zod";
import { FormFieldsSchema } from "@/validators/schemas/form-field";
import { EventSpeakersSchema } from "@/validators/schemas/speaker";
import { EventAssignmentGroupsSchema } from "@/validators/schemas/assignment-group";
import type { FormFieldFormValues } from "@/validators/types/form-field";
import type { EventSpeakerFormValues } from "@/validators/types/speaker";
import type { EventAssignmentGroupFormValues } from "@/validators/schemas/assignment-group";

export const EventStatusEnum = z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]);

export type EventFormValues = {
  title: string;
  slug: string;
  description: string;
  bannerImage: string;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  isFree: boolean;
  ticketPrice: number;
  tagsEnabled: boolean;
  tagPrimaryColor: string;
  tagSecondaryColor: string;
  tagFooterText: string;
  tagFieldKeys: string[];
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  formFields: FormFieldFormValues[];
  speakers: EventSpeakerFormValues[];
  assignmentGroups: EventAssignmentGroupFormValues[];
};

export const EventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().min(1, "Description is required"),
    bannerImage: z.string(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    venue: z.string().min(1, "Venue is required"),
    capacity: z.number().int().min(1, "Capacity must be at least 1"),
    isFree: z.boolean(),
    ticketPrice: z.number().min(0),
    status: EventStatusEnum,
    tagsEnabled: z.boolean(),
    tagPrimaryColor: z.string(),
    tagSecondaryColor: z.string(),
    tagFooterText: z.string(),
    tagFieldKeys: z.array(z.string()),
    formFields: FormFieldsSchema,
    speakers: EventSpeakersSchema,
    assignmentGroups: EventAssignmentGroupsSchema,
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .refine(
    (data) => data.isFree || data.ticketPrice > 0,
    { message: "Ticket price is required for paid events", path: ["ticketPrice"] }
  )
  .refine(
    (data) =>
      data.isFree ||
      data.formFields.some((field) => field.fieldType === "EMAIL"),
    {
      message: "Include at least one Email field for confirmations and payments",
      path: ["formFields"],
    }
  )
  .refine(
    (data) =>
      !data.tagsEnabled ||
      /^#[0-9A-Fa-f]{6}$/.test(data.tagPrimaryColor),
    { message: "Enter a valid hex color", path: ["tagPrimaryColor"] }
  )
  .refine(
    (data) =>
      !data.tagsEnabled ||
      /^#[0-9A-Fa-f]{6}$/.test(data.tagSecondaryColor),
    { message: "Enter a valid hex color", path: ["tagSecondaryColor"] }
  );

export function toInt(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Math.trunc(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : Math.trunc(n);
  }
  return fallback;
}

export function toFloat(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}
