import moment from "moment";
import type { RegistrationUI } from "@/validators/types/event";

export const DEFAULT_TAG_PRIMARY_COLOR = "#4a3428";
export const DEFAULT_TAG_SECONDARY_COLOR = "#f5f0e8";

/** A6 name tag dimensions (105mm × 148mm) in PDF points */
export const MM_TO_PT = 72 / 25.4;
export const TAG_WIDTH_MM = 105;
export const TAG_HEIGHT_MM = 148;
export const TAG_WIDTH_PT = TAG_WIDTH_MM * MM_TO_PT;
export const TAG_HEIGHT_PT = TAG_HEIGHT_MM * MM_TO_PT;

export function mmToPt(mm: number) {
  return mm * MM_TO_PT;
}

export function getPhotoUrlFromResponses(
  fields: Array<{ fieldType: string; fieldKey: string }>,
  responses: Record<string, unknown>
) {
  for (const field of fields) {
    if (field.fieldType !== "IMAGE") continue;
    const value = responses[field.fieldKey];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function getParticipantName(registration: RegistrationUI) {
  return (
    registration.contactName ||
    registration.labeledResponses.find((entry) => /name/i.test(entry.label))?.value ||
    "Guest"
  );
}

export function canPrintRegistrationTag(registration: RegistrationUI) {
  if (!registration.tagsEnabled) {
    return false;
  }

  if (
    registration.status !== "CONFIRMED" &&
    registration.status !== "ATTENDED"
  ) {
    return false;
  }

  return registration.paymentStatus !== "UNPAID";
}

export function getTagDetailLines(registration: RegistrationUI, limit = 6) {
  const participantName = getParticipantName(registration).toUpperCase();
  const responseByKey = new Map(
    registration.labeledResponses.map((entry) => [entry.fieldKey, entry])
  );

  const lines = [{ label: "", value: participantName }];
  const tagFieldKeys = registration.tagFieldKeys;

  if (tagFieldKeys === null) {
    const detailLines = registration.labeledResponses
      .filter((entry) => {
        if (/^(full name|name|email|phone|photo)/i.test(entry.label)) {
          return false;
        }
        if (entry.value === "Photo provided" || !entry.value.trim()) {
          return false;
        }
        return true;
      })
      .map((entry) => ({
        label: entry.label.toUpperCase(),
        value: entry.value.toUpperCase(),
      }));

    return [...lines, ...detailLines].slice(0, limit);
  }

  for (const key of tagFieldKeys) {
    if (key === "full_name") continue;

    const entry = responseByKey.get(key);
    if (!entry || entry.value === "Photo provided" || !entry.value.trim()) {
      continue;
    }

    lines.push({
      label: entry.label.toUpperCase(),
      value: entry.value.toUpperCase(),
    });

    if (lines.length >= limit) break;
  }

  return lines.slice(0, limit);
}

export function formatTagDateRange(startDate: string, endDate: string) {
  const start = moment(startDate);
  const end = moment(endDate);
  const startDay = start.format("Do").toUpperCase();
  const endDay = end.format("Do").toUpperCase();
  const monthYear = start.format("MMMM. YYYY").toUpperCase();

  if (start.isSame(end, "day")) {
    return `${startDay} ${monthYear}`;
  }

  if (start.isSame(end, "month")) {
    return `${startDay} - ${endDay} ${monthYear}`;
  }

  return `${startDay} ${start.format("MMMM").toUpperCase()} - ${endDay} ${end.format("MMMM. YYYY").toUpperCase()}`;
}

export function formatTagVenue(venue: string) {
  const trimmed = venue.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function resolveTagTheme(registration: RegistrationUI) {
  return {
    primary: registration.tagPrimaryColor || DEFAULT_TAG_PRIMARY_COLOR,
    secondary: registration.tagSecondaryColor || DEFAULT_TAG_SECONDARY_COLOR,
    footer:
      registration.tagFooterText?.trim() ||
      registration.eventVenue.trim() ||
      registration.eventTitle,
  };
}
