import { formatResponseValue } from "@/lib/form-fields";
import type { EventUI, RegistrationUI } from "@/validators/types/event";
import type { FormFieldUI } from "@/validators/types/form-field";

export interface RegistrationExportColumn {
  header: string;
  eventId: string;
  fieldKey: string;
  fieldType: FormFieldUI["fieldType"];
}

export function getRegistrationExportColumns(
  registrations: RegistrationUI[],
  events: EventUI[],
  selectedEventId: string
): RegistrationExportColumn[] {
  const eventsById = new Map(events.map((event) => [event.id, event]));

  if (selectedEventId !== "all") {
    const event = eventsById.get(selectedEventId);
    return [...(event?.formFields ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((field) => ({
        header: field.label,
        eventId: selectedEventId,
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
      }));
  }

  const columns: RegistrationExportColumn[] = [];
  const seen = new Set<string>();

  for (const registration of registrations) {
    const event = eventsById.get(registration.eventId);
    if (!event) continue;

    for (const field of [...event.formFields].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const key = `${registration.eventId}:${field.fieldKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      columns.push({
        header: `${event.title} — ${field.label}`,
        eventId: registration.eventId,
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
      });
    }
  }

  return columns;
}

export function buildRegistrationExportRows(
  registrations: RegistrationUI[],
  columns: RegistrationExportColumn[]
): Record<string, string>[] {
  return registrations.map((registration) => {
    const row: Record<string, string> = {};

    for (const column of columns) {
      if (column.eventId !== registration.eventId) {
        row[column.header] = "";
        continue;
      }

      row[column.header] = formatResponseValue(
        registration.responses[column.fieldKey],
        column.fieldType
      );
    }

    return row;
  });
}
