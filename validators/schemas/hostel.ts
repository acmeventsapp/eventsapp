import { z } from "zod";

export const EventHostelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Hostel name is required"),
  branchIds: z.array(z.string()).min(1, "Select at least one branch"),
  sortOrder: z.number().int().min(0),
});

export const EventHostelsSchema = z
  .array(EventHostelSchema)
  .superRefine((hostels, ctx) => {
    const branchToHostel = new Map<string, number>();

    for (const [hostelIndex, hostel] of hostels.entries()) {
      for (const branchId of hostel.branchIds) {
        if (branchToHostel.has(branchId)) {
          ctx.addIssue({
            code: "custom",
            message: "A branch can only be assigned to one hostel",
            path: [hostelIndex, "branchIds"],
          });
          continue;
        }

        branchToHostel.set(branchId, hostelIndex);
      }
    }
  });

export type EventHostelFormValues = z.infer<typeof EventHostelSchema>;
