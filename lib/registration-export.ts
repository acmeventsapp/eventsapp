import { formatResponseValue } from "@/lib/form-fields";
import type { EventUI, RegistrationUI } from "@/validators/types/event";
import type { FormFieldUI } from "@/validators/types/form-field";

export interface RegistrationExportColumn {
  header: string;
  fieldType: FormFieldUI["fieldType"];
}

function sortedFormFields(formFields: FormFieldUI[]) {
  return [...formFields].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getRegistrationExportColumns(
  registrations: RegistrationUI[],
  events: EventUI[],
  selectedEventId: string
): RegistrationExportColumn[] {
  const eventsById = new Map(events.map((event) => [event.id, event]));

  if (selectedEventId !== "all") {
    const event = eventsById.get(selectedEventId);
    return sortedFormFields(event?.formFields ?? []).map((field) => ({
      header: field.label,
      fieldType: field.fieldType,
    }));
  }

  const columns: RegistrationExportColumn[] = [];
  const seen = new Set<string>();

  for (const registration of registrations) {
    const event = eventsById.get(registration.eventId);
    if (!event) continue;

    for (const field of sortedFormFields(event.formFields)) {
      if (seen.has(field.label)) continue;
      seen.add(field.label);
      columns.push({
        header: field.label,
        fieldType: field.fieldType,
      });
    }
  }

  return columns;
}

export function buildRegistrationExportRows(
  registrations: RegistrationUI[],
  columns: RegistrationExportColumn[],
  events: EventUI[]
): Record<string, string>[] {
  const eventsById = new Map(events.map((event) => [event.id, event]));

  return registrations.map((registration) => {
    const event = eventsById.get(registration.eventId);
    const row: Record<string, string> = {};

    for (const column of columns) {
      const field = event?.formFields.find((entry) => entry.label === column.header);
      row[column.header] = field
        ? formatResponseValue(registration.responses[field.fieldKey], field.fieldType)
        : "";
    }

    return row;
  });
}
