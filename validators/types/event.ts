import type {
  Event,
  EventAssignmentGroup,
  EventFormField,
  EventHostel,
  EventRegistration,
  EventSpeaker,
} from "@prisma/client";
import { formatResponseValue, getResponsePreview } from "@/lib/form-fields";
import { getPhotoUrlFromResponses } from "@/lib/name-tag";
import { parseTagFieldKeys } from "@/lib/tag-fields";
import type { OrgBranchValue } from "@/validators/schemas/organization";
import { toFormFieldUI, type FormFieldUI } from "@/validators/types/form-field";
import { toEventSpeakerUI, type EventSpeakerUI } from "@/validators/types/speaker";

export type RegistrationResponses = Record<
  string,
  string | string[] | boolean | OrgBranchValue
>;

export interface AssignmentGroupUI {
  id: string;
  name: string;
  capacity: number;
  targetFieldKey: string | null;
  targetFieldValue: string | null;
  sortOrder: number;
}

export interface EventHostelUI {
  id: string;
  name: string;
  branchIds: string[];
  sortOrder: number;
}

export type EventWithCounts = Event & {
  _count: { registrations: number };
  formFields?: EventFormField[];
  speakers?: EventSpeaker[];
  assignmentGroups?: EventAssignmentGroup[];
  hostels?: EventHostel[];
};

export interface EventUI {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerImage: string | null;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  isFree: boolean;
  ticketPrice: number | null;
  status: Event["status"];
  registrationCount: number;
  remainingSeats: number;
  formFields: FormFieldUI[];
  speakers: EventSpeakerUI[];
  assignmentGroups: AssignmentGroupUI[];
  hostels: EventHostelUI[];
  tagsEnabled: boolean;
  tagPrimaryColor: string;
  tagSecondaryColor: string;
  tagFooterText: string | null;
  tagFieldKeys: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationUI {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventVenue: string;
  eventStartDate: string;
  eventEndDate: string;
  tagsEnabled: boolean;
  tagPrimaryColor: string;
  tagSecondaryColor: string;
  tagFooterText: string | null;
  tagFieldKeys: string[] | null;
  photoUrl: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  responses: RegistrationResponses;
  labeledResponses: Array<{ fieldKey: string; label: string; value: string }>;
  responsePreview: string;
  assignedGroup: string | null;
  assignedHostel: string | null;
  status: EventRegistration["status"];
  paymentRef: string | null;
  paymentStatus: EventRegistration["paymentStatus"];
  amount: number;
  createdAt: string;
}

function parseBranchIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function toAssignmentGroupUI(group: EventAssignmentGroup): AssignmentGroupUI {
  return {
    id: group.id,
    name: group.name,
    capacity: group.capacity,
    targetFieldKey: group.targetFieldKey,
    targetFieldValue: group.targetFieldValue,
    sortOrder: group.sortOrder,
  };
}

export function toEventHostelUI(hostel: EventHostel): EventHostelUI {
  return {
    id: hostel.id,
    name: hostel.name,
    branchIds: parseBranchIds(hostel.branchIds),
    sortOrder: hostel.sortOrder,
  };
}

export function toEventUI(event: EventWithCounts): EventUI {
  const registrationCount = event._count.registrations;
  const formFields = (event.formFields ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toFormFieldUI);
  const speakers = (event.speakers ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toEventSpeakerUI);
  const assignmentGroups = (event.assignmentGroups ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toAssignmentGroupUI);
  const hostels = (event.hostels ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toEventHostelUI);

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    bannerImage: event.bannerImage,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    venue: event.venue,
    capacity: event.capacity,
    isFree: event.isFree,
    ticketPrice: event.ticketPrice ? Number(event.ticketPrice) : null,
    status: event.status,
    registrationCount,
    remainingSeats: Math.max(event.capacity - registrationCount, 0),
    formFields,
    speakers,
    assignmentGroups,
    hostels,
    tagsEnabled: event.tagsEnabled,
    tagPrimaryColor: event.tagPrimaryColor,
    tagSecondaryColor: event.tagSecondaryColor,
    tagFooterText: event.tagFooterText,
    tagFieldKeys: parseTagFieldKeys(event.tagFieldKeys),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function toRegistrationUI(
  registration: EventRegistration & {
    event: Pick<
      Event,
      | "title"
      | "slug"
      | "venue"
      | "startDate"
      | "endDate"
      | "tagsEnabled"
      | "tagPrimaryColor"
      | "tagSecondaryColor"
      | "tagFooterText"
      | "tagFieldKeys"
    > & {
      formFields?: EventFormField[];
    };
    assignmentGroup?: { name: string } | null;
    hostel?: { name: string } | null;
  }
): RegistrationUI {
  const responses = (registration.responses ?? {}) as RegistrationResponses;
  const formFields = (registration.event.formFields ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toFormFieldUI);

  return {
    id: registration.id,
    eventId: registration.eventId,
    eventTitle: registration.event.title,
    eventSlug: registration.event.slug,
    eventVenue: registration.event.venue,
    eventStartDate: registration.event.startDate.toISOString(),
    eventEndDate: registration.event.endDate.toISOString(),
    tagsEnabled: registration.event.tagsEnabled,
    tagPrimaryColor: registration.event.tagPrimaryColor,
    tagSecondaryColor: registration.event.tagSecondaryColor,
    tagFooterText: registration.event.tagFooterText,
    tagFieldKeys: parseTagFieldKeys(registration.event.tagFieldKeys),
    photoUrl: getPhotoUrlFromResponses(formFields, responses),
    contactName: registration.contactName ?? "",
    contactEmail: registration.contactEmail ?? "",
    contactPhone: registration.contactPhone ?? "",
    responses,
    labeledResponses: formFields.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      value: formatResponseValue(responses[field.fieldKey], field.fieldType),
    })),
    responsePreview: getResponsePreview(formFields, responses),
    assignedGroup: registration.assignmentGroup?.name ?? null,
    assignedHostel: registration.hostel?.name ?? null,
    status: registration.status,
    paymentRef: registration.paymentRef,
    paymentStatus: registration.paymentStatus,
    amount: Number(registration.amount),
    createdAt: registration.createdAt.toISOString(),
  };
}
