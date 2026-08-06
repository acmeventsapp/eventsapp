import { z } from "zod";

export const HostelGenderEnum = z.enum(["MALE", "FEMALE"]);

export const EventHostelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Hostel name is required"),
  gender: HostelGenderEnum,
  branchIds: z.array(z.string()).min(1, "Select at least one branch"),
  sortOrder: z.number().int().min(0),
});

export const EventHostelsSchema = z
  .array(EventHostelSchema)
  .superRefine((hostels, ctx) => {
    const branchUsage = new Map<
      string,
      Array<{ hostelIndex: number; gender: z.infer<typeof HostelGenderEnum> }>
    >();

    for (const [hostelIndex, hostel] of hostels.entries()) {
      for (const branchId of hostel.branchIds) {
        const entries = branchUsage.get(branchId) ?? [];
        const duplicateGender = entries.some(
          (entry) => entry.gender === hostel.gender
        );

        if (duplicateGender) {
          ctx.addIssue({
            code: "custom",
            message:
              "This branch is already assigned to a hostel with the same gender",
            path: [hostelIndex, "branchIds"],
          });
          continue;
        }

        if (entries.length >= 2) {
          ctx.addIssue({
            code: "custom",
            message:
              "A branch can only be assigned to two hostels (male and female)",
            path: [hostelIndex, "branchIds"],
          });
          continue;
        }

        entries.push({ hostelIndex, gender: hostel.gender });
        branchUsage.set(branchId, entries);
      }
    }
  });

export type EventHostelFormValues = z.infer<typeof EventHostelSchema>;
