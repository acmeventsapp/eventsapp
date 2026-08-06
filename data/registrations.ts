"use server";

import { prisma } from "@/lib/prisma";
import {
  getBranchIdFromResponses,
  matchesAssignmentGroupFilter,
  parseHostelBranchIds,
} from "@/lib/assignments";
import { extractContactFromResponses } from "@/lib/form-fields";
import {
  buildRegistrationConfirmationEmail,
  sendEmail,
} from "@/lib/send-email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getAdminSession } from "@/data/admin-auth";
import { toFormFieldUI } from "@/validators/types/form-field";
import {
  buildDynamicRegistrationSchema,
  serializeRegistrationResponses,
  type DynamicRegistrationValues,
} from "@/validators/schemas/registration";
import {
  toRegistrationUI,
  type RegistrationResponses,
  type RegistrationUI,
} from "@/validators/types/event";
import type { PaymentStatus, Prisma, RegistrationStatus } from "@prisma/client";

export interface CreateRegistrationInput {
  eventId: string;
  responses: DynamicRegistrationValues;
}

const registrationInclude = {
  event: {
    select: {
      title: true,
      slug: true,
      venue: true,
      startDate: true,
      endDate: true,
      tagsEnabled: true,
      tagPrimaryColor: true,
      tagSecondaryColor: true,
      tagFooterText: true,
      tagFieldKeys: true,
      formFields: {
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
  assignmentGroup: {
    select: { name: true },
  },
  hostel: {
    select: { name: true },
  },
};

type TransactionClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

async function assignToGroup(
  tx: TransactionClient,
  eventId: string,
  registrationId: string,
  responses: RegistrationResponses
): Promise<string | null> {
  const groups = await tx.eventAssignmentGroup.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
  });

  const eligibleGroups = groups.filter((group) =>
    matchesAssignmentGroupFilter(responses, group)
  );

  if (eligibleGroups.length === 0) {
    return null;
  }

  const counts = await tx.eventRegistration.groupBy({
    by: ["assignmentGroupId"],
    where: {
      eventId,
      status: "CONFIRMED",
      assignmentGroupId: { not: null },
    },
    _count: { id: true },
  });

  const countByGroupId = new Map(
    counts.map((entry) => [entry.assignmentGroupId, entry._count.id])
  );

  const availableGroups = eligibleGroups.filter((group) => {
    if (group.capacity === 0) return true;
    const currentCount = countByGroupId.get(group.id) ?? 0;
    return currentCount < group.capacity;
  });

  if (availableGroups.length === 0) {
    return null;
  }

  const selectedGroup =
    availableGroups[Math.floor(Math.random() * availableGroups.length)]!;

  await tx.eventRegistration.update({
    where: { id: registrationId },
    data: { assignmentGroupId: selectedGroup.id },
  });

  return selectedGroup.name;
}

async function assignToHostel(
  tx: TransactionClient,
  eventId: string,
  registrationId: string,
  responses: RegistrationResponses,
  formFields: Array<{ fieldType: string; fieldKey: string }>
): Promise<string | null> {
  const branchId = getBranchIdFromResponses(responses, formFields);
  if (!branchId) {
    return null;
  }

  const hostels = await tx.eventHostel.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
  });

  const matchedHostel = hostels.find((hostel) =>
    parseHostelBranchIds(hostel.branchIds).includes(branchId)
  );

  if (!matchedHostel) {
    return null;
  }

  await tx.eventRegistration.update({
    where: { id: registrationId },
    data: { hostelId: matchedHostel.id },
  });

  return matchedHostel.name;
}

async function assignRegistrant(
  tx: TransactionClient,
  eventId: string,
  registrationId: string,
  responses: RegistrationResponses,
  formFields: Array<{ fieldType: string; fieldKey: string }>
) {
  const assignedGroup = await assignToGroup(
    tx,
    eventId,
    registrationId,
    responses
  );
  const assignedHostel = await assignToHostel(
    tx,
    eventId,
    registrationId,
    responses,
    formFields
  );

  return { assignedGroup, assignedHostel };
}

export async function getRegistrations(filters?: {
  eventId?: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
}): Promise<RegistrationUI[]> {
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId: filters?.eventId,
      status: filters?.status,
      paymentStatus: filters?.paymentStatus,
    },
    include: registrationInclude,
    orderBy: { createdAt: "desc" },
  });

  return registrations.map(toRegistrationUI);
}

export async function getRegistrationById(id: string): Promise<RegistrationUI | null> {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
    include: registrationInclude,
  });

  return registration ? toRegistrationUI(registration) : null;
}

export async function lookupRegistrationForTagReprint(input: {
  eventSlug: string;
  email: string;
  registrationRef: string;
}) {
  try {
    const email = input.email.trim().toLowerCase();
    const registrationRef = input.registrationRef.trim();

    if (!email || !registrationRef) {
      return {
        success: false as const,
        error: "Email and registration reference are required",
      };
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        contactEmail: { equals: email, mode: "insensitive" },
        event: { slug: input.eventSlug, status: "PUBLISHED" },
        status: { in: ["CONFIRMED", "ATTENDED"] },
      },
      include: registrationInclude,
    });

    const normalizedRef = registrationRef.toLowerCase();
    const match = registrations.find(
      (registration) =>
        registration.id === normalizedRef ||
        registration.id.toLowerCase().endsWith(normalizedRef)
    );

    if (!match) {
      return {
        success: false as const,
        error:
          "No matching registration found. Check your email and reference.",
      };
    }

    if (match.paymentStatus === "UNPAID") {
      return {
        success: false as const,
        error: "Payment must be completed before downloading your tag.",
      };
    }

    if (!match.event.tagsEnabled) {
      return {
        success: false as const,
        error: "Name tags are not available for this event.",
      };
    }

    return { success: true as const, data: toRegistrationUI(match) };
  } catch (error) {
    console.error("lookupRegistrationForTagReprint", error);
    return {
      success: false as const,
      error: "Unable to look up your registration. Please try again.",
    };
  }
}

export async function createRegistration(input: CreateRegistrationInput) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      include: {
        registrations: {
          where: { status: { in: ["CONFIRMED", "PENDING"] } },
          select: { id: true },
        },
        formFields: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!event) {
      return { success: false as const, error: "Event not found" };
    }

    if (event.status !== "PUBLISHED") {
      return { success: false as const, error: "Event is not open for registration" };
    }

    if (event.formFields.length === 0) {
      return { success: false as const, error: "Registration form is not configured" };
    }

    if (event.registrations.length >= event.capacity) {
      return { success: false as const, error: "This event is fully booked" };
    }

    const formFields = event.formFields.map(toFormFieldUI);
    const parsed = buildDynamicRegistrationSchema(formFields).safeParse(input.responses);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid registration data";
      return { success: false as const, error: firstError };
    }

    const responses = serializeRegistrationResponses(formFields, parsed.data);
    const contact = extractContactFromResponses(formFields, responses);

    if (!event.isFree && !contact.contactEmail) {
      return { success: false as const, error: "A valid email response is required" };
    }

    const amount = event.isFree ? 0 : Number(event.ticketPrice ?? 0);
    const paymentStatus = event.isFree ? "FREE" : "UNPAID";
    const status = event.isFree ? "CONFIRMED" : "PENDING";

    let assignedGroup: string | null = null;
    let assignedHostel: string | null = null;

    const registration = await prisma.$transaction(async (tx) => {
      const created = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          responses,
          contactEmail: contact.contactEmail || null,
          contactName: contact.contactName || null,
          contactPhone: contact.contactPhone || null,
          amount,
          paymentStatus,
          status,
        },
      });

      if (event.isFree) {
        const assignments = await assignRegistrant(
          tx,
          event.id,
          created.id,
          responses as RegistrationResponses,
          event.formFields
        );
        assignedGroup = assignments.assignedGroup;
        assignedHostel = assignments.assignedHostel;
      }

      return tx.eventRegistration.findUniqueOrThrow({
        where: { id: created.id },
        include: registrationInclude,
      });
    });

    if (event.isFree && registration.contactEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      await sendEmail({
        to: registration.contactEmail,
        subject: `Registration confirmed — ${event.title}`,
        html: buildRegistrationConfirmationEmail({
          fullName: registration.contactName || "there",
          eventTitle: event.title,
          eventDate: formatDate(event.startDate),
          venue: event.venue,
          registrationId: registration.id,
          amount: formatCurrency(0),
          isPaid: false,
          assignedGroup,
          assignedHostel,
          responses,
          formFields,
          reprintUrl: event.tagsEnabled
            ? `${siteUrl}/events/${event.slug}/reprint`
            : undefined,
        }),
      });
    }

    return {
      success: true as const,
      data: toRegistrationUI(registration),
      requiresPayment: !event.isFree,
    };
  } catch (error) {
    console.error("createRegistration", error);
    return { success: false as const, error: "Failed to create registration" };
  }
}

export async function updateRegistrationStatus(
  id: string,
  data: {
    status?: RegistrationStatus;
    paymentStatus?: PaymentStatus;
    paymentRef?: string | null;
  }
) {
  try {
    const shouldAssign =
      data.status === "CONFIRMED" && data.paymentStatus === "PAID";

    let assignedGroup: string | null = null;
    let assignedHostel: string | null = null;

    const registration = await prisma.$transaction(async (tx) => {
      const updated = await tx.eventRegistration.update({
        where: { id },
        data,
        include: registrationInclude,
      });

      if (shouldAssign) {
        const responses = updated.responses as RegistrationResponses;
        const assignments = await assignRegistrant(
          tx,
          updated.eventId,
          updated.id,
          responses,
          updated.event.formFields ?? []
        );
        assignedGroup = assignments.assignedGroup;
        assignedHostel = assignments.assignedHostel;

        return tx.eventRegistration.findUniqueOrThrow({
          where: { id: updated.id },
          include: registrationInclude,
        });
      }

      return updated;
    });

    if (shouldAssign) {
      const formFields = (registration.event.formFields ?? []).map(toFormFieldUI);
      const responses = registration.responses as RegistrationResponses;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      await sendEmail({
        to: registration.contactEmail!,
        subject: `Payment confirmed — ${registration.event.title}`,
        html: buildRegistrationConfirmationEmail({
          fullName: registration.contactName || "there",
          eventTitle: registration.event.title,
          eventDate: formatDate(registration.event.startDate),
          venue: registration.event.venue,
          registrationId: registration.id,
          amount: formatCurrency(Number(registration.amount)),
          isPaid: true,
          assignedGroup: assignedGroup ?? registration.assignmentGroup?.name ?? null,
          assignedHostel: assignedHostel ?? registration.hostel?.name ?? null,
          responses,
          formFields,
          reprintUrl: registration.event.tagsEnabled
            ? `${siteUrl}/events/${registration.event.slug}/reprint`
            : undefined,
        }),
      });
    }

    return { success: true as const, data: toRegistrationUI(registration) };
  } catch (error) {
    console.error("updateRegistrationStatus", error);
    return { success: false as const, error: "Failed to update registration" };
  }
}

export async function deleteRegistration(id: string) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false as const, error: "Unauthorized" };
    }

    await prisma.eventRegistration.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("deleteRegistration", error);
    return { success: false as const, error: "Failed to delete registration" };
  }
}

export async function adminUpdateRegistrationStatus(
  id: string,
  data: {
    status: RegistrationStatus;
    paymentStatus: PaymentStatus;
    paymentRef?: string;
  }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false as const, error: "Unauthorized" };
    }

    return updateRegistrationStatus(id, {
      status: data.status,
      paymentStatus: data.paymentStatus,
      paymentRef: data.paymentRef?.trim() || undefined,
    });
  } catch (error) {
    console.error("adminUpdateRegistrationStatus", error);
    return { success: false as const, error: "Failed to update registration" };
  }
}

export async function getRegistrationWithEvent(id: string) {
  return prisma.eventRegistration.findUnique({
    where: { id },
    include: {
      assignmentGroup: {
        select: { name: true },
      },
      hostel: {
        select: { name: true },
      },
      event: {
        include: {
          formFields: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}
