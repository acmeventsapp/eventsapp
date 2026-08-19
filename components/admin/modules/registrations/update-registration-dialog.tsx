"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DialogModal } from "@/components/custom/custom-modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateRegistrationStatus } from "@/hooks/use-registrations";
import {
  AdminUpdateRegistrationSchema,
  type AdminUpdateRegistrationValues,
} from "@/validators/schemas/registration-admin";
import type { RegistrationUI } from "@/validators/types/event";

interface UpdateRegistrationDialogProps {
  registration: RegistrationUI | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (registration: RegistrationUI) => void;
}

export default function UpdateRegistrationDialog({
  registration,
  open,
  onOpenChange,
  onUpdated,
}: UpdateRegistrationDialogProps) {
  const { mutateAsync: updateRegistration, isLoading } = useUpdateRegistrationStatus();

  const form = useForm<AdminUpdateRegistrationValues>({
    resolver: zodResolver(AdminUpdateRegistrationSchema),
    defaultValues: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentRef: "",
    },
  });

  useEffect(() => {
    if (!registration || !open) return;

    form.reset({
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      paymentRef: registration.paymentRef ?? "",
    });
  }, [form, open, registration]);

  async function onSubmit(values: AdminUpdateRegistrationValues) {
    if (!registration) return;

    const result = await updateRegistration({
      id: registration.id,
      data: values,
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
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title="Update status"
      description={
        registration
          ? `Update payment and registration status for ${registration.contactName || registration.responsePreview}.`
          : undefined
      }
      showFooter={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="ATTENDED">Attended</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment reference</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional Paystack reference" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogModal>
  );
}
