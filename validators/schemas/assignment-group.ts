import { z } from "zod";

export const EventAssignmentGroupSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Group name is required"),
    capacity: z.number().int().min(0, "Capacity must be 0 or greater"),
    targetFieldKey: z.string().optional(),
    targetFieldValue: z.string().optional(),
    sortOrder: z.number().int().min(0),
  })
  .superRefine((group, ctx) => {
    const hasFilterField = Boolean(group.targetFieldKey?.trim());
    if (hasFilterField && !group.targetFieldValue?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the required answer value for this filter",
        path: ["targetFieldValue"],
      });
    }
  });

export const EventAssignmentGroupsSchema = z.array(EventAssignmentGroupSchema);

export type EventAssignmentGroupFormValues = z.infer<
  typeof EventAssignmentGroupSchema
>;
