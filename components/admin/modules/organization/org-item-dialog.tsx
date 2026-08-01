"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DialogModal } from "@/components/custom/custom-modal";
import { ButtonSpinner } from "@/components/custom/spinner";
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

const NameOnlySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const UnitDialogSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  zoneId: z.string().min(1, "Zone is required"),
});

const BranchDialogSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  unitId: z.string().min(1, "Unit is required"),
});

type ParentOption = { id: string; name: string };

type ZoneDialogProps = {
  kind: "zone";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName?: string;
  isSaving?: boolean;
  onSubmit: (values: { name: string }) => Promise<void>;
};

type UnitDialogProps = {
  kind: "unit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName?: string;
  initialParentId?: string;
  parentOptions: ParentOption[];
  isSaving?: boolean;
  onSubmit: (values: { name: string; zoneId: string }) => Promise<void>;
};

type BranchDialogProps = {
  kind: "branch";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName?: string;
  initialParentId?: string;
  parentOptions: ParentOption[];
  isSaving?: boolean;
  onSubmit: (values: { name: string; unitId: string }) => Promise<void>;
};

export type OrgItemDialogProps = ZoneDialogProps | UnitDialogProps | BranchDialogProps;

export default function OrgItemDialog(props: OrgItemDialogProps) {
  if (props.kind === "zone") {
    return <ZoneDialog {...props} />;
  }
  if (props.kind === "unit") {
    return <UnitDialog {...props} />;
  }
  return <BranchDialog {...props} />;
}

function ZoneDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  isSaving,
  onSubmit,
}: ZoneDialogProps) {
  const form = useForm<z.infer<typeof NameOnlySchema>>({
    resolver: zodResolver(NameOnlySchema),
    defaultValues: { name: initialName },
  });

  useEffect(() => {
    if (open) form.reset({ name: initialName });
  }, [form, initialName, open]);

  return (
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      showFooter
      saveLabel={isSaving ? "Saving..." : "Save"}
      saveDisabled={isSaving || form.formState.isSubmitting}
      onSave={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Form {...form}>
        <form className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. North Zone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DialogModal>
  );
}

function UnitDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialParentId = "",
  parentOptions,
  isSaving,
  onSubmit,
}: UnitDialogProps) {
  const form = useForm<z.infer<typeof UnitDialogSchema>>({
    resolver: zodResolver(UnitDialogSchema),
    defaultValues: { name: initialName, zoneId: initialParentId },
  });

  useEffect(() => {
    if (open) form.reset({ name: initialName, zoneId: initialParentId });
  }, [form, initialName, initialParentId, open]);

  return (
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      showFooter
      saveLabel={isSaving ? "Saving..." : "Save"}
      saveDisabled={isSaving || form.formState.isSubmitting}
      onSave={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Form {...form}>
        <form className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="zoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. St. Mary's Unit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DialogModal>
  );
}

function BranchDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialParentId = "",
  parentOptions,
  isSaving,
  onSubmit,
}: BranchDialogProps) {
  const form = useForm<z.infer<typeof BranchDialogSchema>>({
    resolver: zodResolver(BranchDialogSchema),
    defaultValues: { name: initialName, unitId: initialParentId },
  });

  useEffect(() => {
    if (open) form.reset({ name: initialName, unitId: initialParentId });
  }, [form, initialName, initialParentId, open]);

  return (
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      showFooter
      saveLabel={isSaving ? "Saving..." : "Save"}
      saveDisabled={isSaving || form.formState.isSubmitting}
      onSave={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Form {...form}>
        <form className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Youth Branch" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isSaving ? (
            <p className="text-sm text-muted-foreground">
              <ButtonSpinner label="Saving..." />
            </p>
          ) : null}
        </form>
      </Form>
    </DialogModal>
  );
}
