"use server";

import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_FORM_FIELDS, normalizeFieldOptions, slugifyFieldKey } from "@/lib/form-fields";
import { slugify } from "@/lib/utils";
import { sanitizeTagFieldKeys } from "@/lib/tag-fields";
import { toEventUI, type EventUI } from "@/validators/types/event";
import type { EventFormValues } from "@/validators/schemas/event";
import { Prisma, type EventStatus } from "@prisma/client";

const eventInclude = {
  registrations: {
    where: { status: { in: ["CONFIRMED", "PENDING"] as ("CONFIRMED" | "PENDING")[] } },
    select: { id: true },
  },
  formFields: {
    orderBy: { sortOrder: "asc" as const },
  },
  speakers: {
    orderBy: { sortOrder: "asc" as const },
  },
  assignmentGroups: {
    orderBy: { sortOrder: "asc" as const },
  },
};

function mapFormFields(formFields: EventFormValues["formFields"]) {
  return formFields.map((field, index) => ({
    label: field.label.trim(),
    fieldKey: field.fieldKey.trim() || slugifyFieldKey(field.label),
    fieldType: field.fieldType,
    placeholder: field.placeholder.trim() || null,
    helpText: field.helpText.trim() || null,
    required: field.required,
    options: fieldHasOptions(field.fieldType) && !field.dependsOn
      ? normalizeFieldOptions(field.options)
      : [],
    dependsOn: field.dependsOn?.trim() || null,
    conditionalOptions:
      field.dependsOn?.trim() && field.conditionalOptions
        ? field.conditionalOptions
        : Prisma.DbNull,
    sortOrder: index,
  }));
}

function fieldHasOptions(fieldType: EventFormValues["formFields"][number]["fieldType"]) {
  return fieldType === "SELECT" || fieldType === "RADIO" || fieldType === "CHECKBOX";
}

function mapEventInput(data: EventFormValues) {
  return {
    title: data.title,
    slug: data.slug || slugify(data.title),
    description: data.description,
    bannerImage: data.bannerImage || null,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    venue: data.venue,
    capacity: data.capacity,
    isFree: data.isFree,
    ticketPrice: data.isFree ? null : data.ticketPrice,
    status: data.status,
    tagsEnabled: data.tagsEnabled,
    tagPrimaryColor: data.tagPrimaryColor,
    tagSecondaryColor: data.tagSecondaryColor,
    tagFooterText: data.tagFooterText.trim() || null,
    tagFieldKeys: data.tagsEnabled
      ? sanitizeTagFieldKeys(data.tagFieldKeys, data.formFields)
      : Prisma.DbNull,
  };
}

function toEventWithCount(event: {
  registrations: { id: string }[];
  formFields: Parameters<typeof toEventUI>[0]["formFields"];
  speakers: Parameters<typeof toEventUI>[0]["speakers"];
  assignmentGroups: Parameters<typeof toEventUI>[0]["assignmentGroups"];
} & Omit<
  Parameters<typeof toEventUI>[0],
  "_count" | "formFields" | "speakers" | "assignmentGroups"
>) {
  return toEventUI({
    ...event,
    _count: { registrations: event.registrations.length },
    formFields: event.formFields,
    speakers: event.speakers,
    assignmentGroups: event.assignmentGroups,
  });
}

function mapSpeakers(speakers: EventFormValues["speakers"]) {
  return speakers.map((speaker, index) => ({
    name: speaker.name.trim(),
    role: speaker.role.trim() || null,
    bio: speaker.bio.trim() || null,
    photoUrl: speaker.photoUrl.trim() || null,
    sortOrder: index,
  }));
}

async function syncEventSpeakers(
  eventId: string,
  speakers: EventFormValues["speakers"]
) {
  const mappedSpeakers = mapSpeakers(speakers);
  const keepIds = speakers.map((speaker) => speaker.id).filter(Boolean) as string[];

  await prisma.eventSpeaker.deleteMany({
    where: keepIds.length ? { eventId, id: { notIn: keepIds } } : { eventId },
  });

  for (const [index, speaker] of mappedSpeakers.entries()) {
    const sourceSpeaker = speakers[index];

    if (sourceSpeaker?.id) {
      await prisma.eventSpeaker.update({
        where: { id: sourceSpeaker.id },
        data: speaker,
      });
      continue;
    }

    await prisma.eventSpeaker.create({
      data: {
        eventId,
        ...speaker,
      },
    });
  }
}

async function syncEventFormFields(
  eventId: string,
  formFields: EventFormValues["formFields"]
) {
  const mappedFields = mapFormFields(formFields);
  const keepIds = formFields.map((field) => field.id).filter(Boolean) as string[];

  await prisma.eventFormField.deleteMany({
    where: keepIds.length ? { eventId, id: { notIn: keepIds } } : { eventId },
  });

  for (const [index, field] of mappedFields.entries()) {
    const sourceField = formFields[index];

    if (sourceField?.id) {
      await prisma.eventFormField.update({
        where: { id: sourceField.id },
        data: field,
      });
      continue;
    }

    await prisma.eventFormField.create({
      data: {
        eventId,
        ...field,
      },
    });
  }
}

function mapAssignmentGroups(assignmentGroups: EventFormValues["assignmentGroups"]) {
  return assignmentGroups.map((group, index) => ({
    name: group.name.trim(),
    capacity: group.capacity,
    sortOrder: index,
  }));
}

async function syncEventAssignmentGroups(
  eventId: string,
  assignmentGroups: EventFormValues["assignmentGroups"]
) {
  const mappedGroups = mapAssignmentGroups(assignmentGroups);
  const keepIds = assignmentGroups.map((group) => group.id).filter(Boolean) as string[];

  await prisma.eventAssignmentGroup.deleteMany({
    where: keepIds.length ? { eventId, id: { notIn: keepIds } } : { eventId },
  });

  for (const [index, group] of mappedGroups.entries()) {
    const sourceGroup = assignmentGroups[index];

    if (sourceGroup?.id) {
      await prisma.eventAssignmentGroup.update({
        where: { id: sourceGroup.id },
        data: group,
      });
      continue;
    }

    await prisma.eventAssignmentGroup.create({
      data: {
        eventId,
        ...group,
      },
    });
  }
}

export async function getEvents(options?: {
  status?: EventStatus;
  publishedOnly?: boolean;
}): Promise<EventUI[]> {
  const where = options?.publishedOnly
    ? { status: "PUBLISHED" as const }
    : options?.status
      ? { status: options.status }
      : {};

  const events = await prisma.event.findMany({
    where,
    include: eventInclude,
    orderBy: { startDate: "asc" },
  });

  return events.map(toEventWithCount);
}

export async function getEventBySlug(slug: string): Promise<EventUI | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: eventInclude,
  });

  return event ? toEventWithCount(event) : null;
}

export async function getEventById(id: string): Promise<EventUI | null> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });

  return event ? toEventWithCount(event) : null;
}

export async function createEvent(data: EventFormValues) {
  try {
    const event = await prisma.event.create({
      data: {
        ...mapEventInput(data),
        formFields: {
          create: mapFormFields(
            data.formFields.length ? data.formFields : DEFAULT_EVENT_FORM_FIELDS
          ),
        },
        speakers: {
          create: mapSpeakers(data.speakers),
        },
        assignmentGroups: {
          create: mapAssignmentGroups(data.assignmentGroups),
        },
      },
      include: eventInclude,
    });

    return { success: true as const, data: toEventWithCount(event) };
  } catch (error) {
    console.error("createEvent", error);
    return { success: false as const, error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, data: EventFormValues) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: mapEventInput(data),
      include: eventInclude,
    });

    await syncEventFormFields(id, data.formFields);
    await syncEventSpeakers(id, data.speakers);
    await syncEventAssignmentGroups(id, data.assignmentGroups);

    const refreshed = await prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    return {
      success: true as const,
      data: refreshed ? toEventWithCount(refreshed) : toEventWithCount(event),
    };
  } catch (error) {
    console.error("updateEvent", error);
    return { success: false as const, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("deleteEvent", error);
    return { success: false as const, error: "Failed to delete event" };
  }
}
