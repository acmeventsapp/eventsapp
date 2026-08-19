"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import DynamicRegistrationForm from "@/components/custom/dynamic-registration-form";
import { ScrollableDialogModal } from "@/components/custom/custom-modal";
import { Button } from "@/components/ui/button";
import { useUpdateRegistration } from "@/hooks/use-registrations";
import {
  buildRegistrationFormValues,
  type DynamicRegistrationValues,
} from "@/validators/schemas/registration";
import type { RegistrationUI } from "@/validators/types/event";
import type { FormFieldUI } from "@/validators/types/form-field";

interface EditRegistrationDialogProps {
  registration: RegistrationUI | null;
  formFields: FormFieldUI[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (registration: RegistrationUI) => void;
}

export default function EditRegistrationDialog({
  registration,
  formFields,
  open,
  onOpenChange,
  onUpdated,
}: EditRegistrationDialogProps) {
  const { mutateAsync: updateRegistration, isLoading } = useUpdateRegistration();

  const initialValues = useMemo(() => {
    if (!registration) return undefined;
    return buildRegistrationFormValues(formFields, registration.responses);
  }, [formFields, registration]);

  async function onSubmit(values: DynamicRegistrationValues) {
    if (!registration) return;

    const result = await updateRegistration({
      id: registration.id,
      responses: values,
    });

    if (!result.success) {
      toast.error(result.error ?? "Failed to update registration");
      return;
    }

    toast.success("Registration updated");
    onUpdated?.(result.data);
    onOpenChange(false);
  }

  return (
    <ScrollableDialogModal
      open={open}
      onOpenChange={onOpenChange}
      title="Update registration"
      description={
        registration
          ? `Edit form responses for ${registration.contactName || registration.responsePreview}.`
          : undefined
      }
      maxWidth="sm:max-w-xl"
      scrollHeight="max-h-[70vh]"
      showFooter={false}
    >
      {registration && formFields.length > 0 ? (
        <DynamicRegistrationForm
          key={registration.id}
          fields={formFields}
          initialValues={initialValues}
          onSubmit={onSubmit}
        >
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DynamicRegistrationForm>
      ) : (
        <p className="text-sm text-muted-foreground pb-4">
          This event does not have a registration form configured.
        </p>
      )}
    </ScrollableDialogModal>
  );
}
